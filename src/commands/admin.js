const { ActivityType } = require('discord.js');
const { readConfig, saveConfig } = require('../services/config');

const isOwner = (userId) => userId === process.env.OWNER_ID;

// ── role ──────────────────────────────────────────────────────────────────────
async function role(interaction) {
    if (!isOwner(interaction.user.id))
        return interaction.reply({ content: '❌ You are not authorized to use this command.', flags: 64 });

    const { options, guild } = interaction;
    const user   = options.getUser('user');
    const role   = options.getRole('role');
    const action = options.getString('action');
    

    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return interaction.reply({ content: '❌ User not found.', flags: 64 });

    if (action === 'give') {
        if (member.roles.cache.has(role.id))
            return interaction.reply({ content: `⚠️ **${user.username}** already has the **${role.name}** role.`, flags: 64 });

        await member.roles.add(role);
        return interaction.reply({ content: `✅ **${role.name}** given to **${user.username}**.`, flags: 64 });
    }

    if (action === 'take') {
        if (!member.roles.cache.has(role.id))
            return interaction.reply({ content: `⚠️ **${user.username}** doesn't have the **${role.name}** role.`, flags: 64 });

        await member.roles.remove(role);
        return interaction.reply({ content: `✅ **${role.name}** removed from **${user.username}**.`, flags: 64 });
    }
}

// ── setStatus ─────────────────────────────────────────────────────────────────
async function setStatus(client, interaction) {
    if (!isOwner(interaction.user.id))
        return interaction.reply({ content: '❌ You are not authorized to use this command.', flags: 64 });

    const type   = interaction.options.getString('type');
    const status = interaction.options.getString('message');

    const activityMap = {
        playing:   ActivityType.Playing,
        listening: ActivityType.Listening,
        watching:  ActivityType.Watching,
        competing: ActivityType.Competing,
        custom:    ActivityType.Custom,
    };

    client.user.setPresence({
        activities: [{ name: status, type: activityMap[type] }],
    });

    await interaction.reply({ content: `✅ Status updated to **${type}: ${status}**`, flags: 64 });
}

// ── setup ─────────────────────────────────────────────────────────────────────
async function setup(interaction) {
    if (!isOwner(interaction.user.id))
        return interaction.reply({ content: '❌ You are not authorized to use this command.', flags: 64 });

    await interaction.deferReply({ flags: 64 });

    const { options, guild, user } = interaction;

    const welcomeChannel = options.getChannel('welcome');
    const byeChannel     = options.getChannel('bye');
    const memberChannel  = options.getChannel('member');
    const rulesChannel   = options.getChannel('rules');
    const role           = options.getRole('role');
    const logChannel     = options.getChannel('log');

    const config = await readConfig();

    config[guild.id] = {
        serverName:              guild.name,
        WELCOME_CHANNEL:         welcomeChannel?.id || null,
        BYE_CHANNEL:             byeChannel?.id     || null,
        MEMBER_COUNT_CHANNEL_ID: memberChannel?.id  || null,
        RULES_CHANNEL:           rulesChannel?.id   || null,
        LOG_CHANNEL:             logChannel?.id     || null,
        DEFAULT_ROLE_ID:         role?.id           || null,
        savedBy:                 user.id,
        savedAt:                 new Date().toISOString(),
    };

    await saveConfig(config);

    console.log(`[SETUP] Guild ${guild.id} (${guild.name}) configured by ${user.username}`);
    await interaction.editReply({ content: '✅ Setup complete! Configuration saved.' });
}

module.exports = { role, setStatus, setup };
