import dotenv from 'dotenv'
dotenv.config()

import { Client, Intents, Collection } from 'discord.js'
import { readdirSync } from 'fs'
import type ApplicationCommand from './templates/ApplicationCommand'
import type Event from './templates/Event'
import type MessageCommand from './templates/MessageCommand'
const token: string = process.env['TOKEN'] as string

// Discord client object
global.client = Object.assign(
    new Client({
        intents: [
            Intents.FLAGS.GUILDS,
            Intents.FLAGS.GUILD_MESSAGES,
            Intents.FLAGS.DIRECT_MESSAGES,
        ],
        partials: ['CHANNEL'],
    }),
    {
        commands: new Collection<string, ApplicationCommand>(),
        msgCommands: new Collection<string, MessageCommand>(),
    }
)

// Set each command in the commands folder as a command in the client.commands collection
const commandFiles: string[] = readdirSync('./commands').filter((file) =>
    file.endsWith('.ts')
)
for (const file of commandFiles) {
    const command: ApplicationCommand = (await import(
        `./commands/${file}`
    )) as ApplicationCommand
    client.commands.set(command.name, command)
}

const msgCommandFiles: string[] = readdirSync('./messageCommands').filter(
    (file) => file.endsWith('.ts')
)
for (const file of msgCommandFiles) {
    const command: MessageCommand = (await import(
        `./messageCommands/${file}`
    )) as MessageCommand
    client.msgCommands.set(command.name, command)
}

// Event handling
const eventFiles: string[] = readdirSync('./events').filter((file) =>
    file.endsWith('.ts')
)

for (const file of eventFiles) {
    const event: Event = (await import(`./events/${file}`)) as Event
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args))
    } else {
        client.on(event.name, (...args) => event.execute(...args))
    }
}

await client.login(token)
