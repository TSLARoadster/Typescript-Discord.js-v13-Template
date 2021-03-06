/* eslint-disable @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment */
import type { ApplicationCommandData, Guild } from 'discord.js'
import { readdirSync } from 'fs'
import type ApplicationCommand from '../templates/ApplicationCommand'
import { prefix } from '../config.json'
import MessageCommand from '../templates/MessageCommand'

type CommandData = PartialBy<ApplicationCommand, 'execute' | 'permissions'>

export default new MessageCommand({
    name: 'deploy',
    description: 'Deploys the slash commands',
    async execute(message, args): Promise<void> {
        if (message.author.id !== client.application?.owner?.id) return

        if (!args[0]) {
            await message.reply(
                `Incorrect number of arguments! The correct format is \`${prefix}deploy <guild/global>\``
            )
            return
        }

        if (args[0].toLowerCase() === 'global') {
            // global deployment

            const commandData: ApplicationCommandData[] = []
            const permissionsData: {
                name: string
                permissions: ApplicationCommand['permissions']
            }[] = []
            const inGuild: boolean = message.guildId ? true : false

            const files: string[] = readdirSync('./commands').filter((file) =>
                file.endsWith('.js')
            )

            // loop through each file and filter for the command and permissions data
            for (const file of files) {
                delete require.cache[require.resolve(`../commands/${file}`)]

                const commandInfo: ApplicationCommand = require(`../commands/${file}`)

                permissionsData.push({
                    name: commandInfo.name,
                    permissions: commandInfo.permissions ?? [],
                })

                // remove the execute function and permissions from the command data
                const processedCommandInfo: CommandData = commandInfo

                delete processedCommandInfo.execute
                delete processedCommandInfo.permissions

                commandData.push(processedCommandInfo as ApplicationCommandData)
            }

            // deploy the commands
            const commands = await client.application?.commands.set(commandData)

            if (inGuild) {
                // set the permissions for each command for that guild (permissions will only work in said guild, if you need global permissions then you'll have to manually do it)
                for (const permissionInfo of permissionsData) {
                    const command = commands.find(
                        (command) => command.name === permissionInfo.name
                    )

                    await command?.permissions.set({
                        permissions: permissionInfo.permissions,
                        guild: message.guild as Guild,
                        token: process.env['TOKEN'] as string,
                    })
                }
            }

            await message.reply('Deploying!')
        } else if (args[0].toLowerCase() === 'guild') {
            // guild deployment

            const commandData: ApplicationCommandData[] = []
            const permissionsData: {
                name: string
                permissions: ApplicationCommand['permissions']
            }[] = []
            const inGuild: boolean = message.guildId ? true : false

            if (!inGuild) {
                await message.reply('Do this in a guild!')
                return
            }

            const files: string[] = readdirSync('./commands').filter((file) =>
                file.endsWith('.js')
            )

            // loop through each file and filter for the command and permissions data
            for (const file of files) {
                delete require.cache[require.resolve(`../commands/${file}`)]

                const commandInfo: ApplicationCommand = require(`../commands/${file}`)

                permissionsData.push({
                    name: commandInfo.name,
                    permissions: commandInfo.permissions ?? [],
                })

                // remove the execute function and permissions from the command data
                const processedCommandInfo: CommandData = commandInfo

                delete processedCommandInfo.execute
                delete processedCommandInfo.permissions

                commandData.push(processedCommandInfo as ApplicationCommandData)
            }

            const commands = await message.guild?.commands.set(commandData)

            if (!commands) {
                await message.reply('T')
                return
            }

            for (const permissionInfo of permissionsData) {
                const command = commands.find(
                    (command) => command.name === permissionInfo.name
                )

                await command?.permissions.set({
                    permissions: permissionInfo.permissions,
                    token: process.env['TOKEN'] as string,
                })
            }

            await message.reply('Deploying!')
        }
    },
})
