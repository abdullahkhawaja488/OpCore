require('dotenv').config();
const { readConfig } = require('./services/config');
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
// ── Member count update on startup + every 10 mins ────────────────────────
async function updateAllMemberCounts() {
    const config = await readConfig();
    for (const [guildId, conf] of Object.entries(config)) {
        if (!conf.MEMBER_COUNT_CHANNEL_ID) continue;
        const guild = client.guilds.cache.get(guildId);
        if (!guild) continue;
        const channel = guild.channels.cache.get(conf.MEMBER_COUNT_CHANNEL_ID);
        if (!channel) continue;
        await channel.setName(`Members: ${guild.memberCount}`).catch(err =>
            console.error(`[BOT] Member count update failed for ${guild.name}:`, err.message)
        );
    }
}


// ── Register slash commands on ready ─────────────────────────────────────────
client.once('clientReady', async () => {

    console.log(`[BOT] Logged in as ${client.user.tag}`);

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    const commands = getAllCommands();

    // Register to every guild the bot is currently in
    for (const guild of client.guilds.cache.values()) {
        try {
            await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, guild.id),
                { body: commands }
            );
            console.log(`[BOT] Commands registered for ${guild.name}`);
        } catch (err) {
            console.error(`[BOT] Failed for ${guild.name}:`, err.message);
        }
    }
    await updateAllMemberCounts();
    setInterval(updateAllMemberCounts, 10 * 60 * 1000);
});

// Register commands when the bot joins a new server
client.on('guildCreate', async (guild) => {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    const commands = getAllCommands();
    try {
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, guild.id),
            { body: commands }
        );
        console.log(`[BOT] Joined ${guild.name} — commands registered`);
    } catch (err) {
        console.error(`[BOT] Failed to register for ${guild.name}:`, err.message);
    }
    
});

// ── Events ────────────────────────────────────────────────────────────────────
client.on('interactionCreate', (interaction) => handleInteraction(client, interaction));
client.on('guildMemberAdd',    (member)      => handleMemberAdd(member));
client.on('guildMemberRemove', (member)      => handleMemberRemove(member));

client.login(process.env.DISCORD_TOKEN);

// ── Dashboard status trigger watcher ─────────────────────────────────────────
const fs   = require('fs');
const path = require('path');
const { ActivityType } = require('discord.js');

const TRIGGER_PATH = path.join(__dirname, '../data/status_trigger.json');
const activityMap  = {
    playing:   ActivityType.Playing,
    listening: ActivityType.Listening,
    watching:  ActivityType.Watching,
    competing: ActivityType.Competing,
    custom:    ActivityType.Custom,
};

setInterval(() => {
    if (!fs.existsSync(TRIGGER_PATH)) return;
    try {
        const { type, message } = JSON.parse(fs.readFileSync(TRIGGER_PATH, 'utf8'));
        if (type && message && activityMap[type]) {
            client.user?.setPresence({ activities: [{ name: message, type: activityMap[type] }] });
            console.log(`[BOT] Status updated via dashboard: ${type} — ${message}`);
        }
        fs.unlinkSync(TRIGGER_PATH);
    } catch { /* ignore malformed trigger */ }
}, 5000);
