require('dotenv').config();
const {
    Client, GatewayIntentBits, Partials,
    REST, Routes
} = require('discord.js');

const { handleInteraction } = require('./commands/handler');
const { handleMemberAdd }    = require('./events/guildMemberAdd');
const { handleMemberRemove } = require('./events/guildMemberRemove');
const { getAllCommands }      = require('./commands/registry');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

// ── Register slash commands on ready ─────────────────────────────────────────
client.once('clientReady', async () => {
    console.log(`[BOT] Logged in as ${client.user.tag}`);

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    const commands = getAllCommands();

    try {
        // Register to both guilds in servers.json
        const guildIds = [process.env.CZPK, process.env.CHILLZONE].filter(Boolean);
        for (const guildId of guildIds) {
            await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
                { body: commands }
            );
            console.log(`[BOT] Slash commands registered for guild ${guildId}`);
        }
    } catch (err) {
        console.error('[BOT] Failed to register commands:', err);
    }
});

// ── Events ────────────────────────────────────────────────────────────────────
client.on('interactionCreate', (interaction) => handleInteraction(client, interaction));
client.on('guildMemberAdd',    (member)      => handleMemberAdd(member));
client.on('guildMemberRemove', (member)      => handleMemberRemove(member));

client.login(process.env.DISCORD_TOKEN);
