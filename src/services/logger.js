const { EmbedBuilder } = require('discord.js');
const { readConfig } = require('./config');

const colorMap = {
    kick:           0xE67E22,
    ban:            0xE74C3C,
    unban:          0x2ECC71,
    tmt:            0xE91E63,
    cancel_timeout: 0x9B59B6,
    clear:          0x3498DB,
    warn:           0xF1C40F,
    clearwarn:      0x1ABC9C,
    'ticket open':  0x5865F2,
    'ticket close': 0x99AAB5,
    'ticket close (button)': 0x99AAB5,
};

async function logToChannel(client, { guildId, guildName, userId, username, command, target, reason }) {
    try {
        const config = await readConfig();
        const guildConf = config[guildId];
        if (!guildConf?.LOG_CHANNEL) return;

        const channel = await client.channels.fetch(guildConf.LOG_CHANNEL).catch(() => null);
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setColor(colorMap[command] || 0x95A5A6)
            .setTitle(`🛡️ ${command.toUpperCase()}`)
            .addFields(
                { name: 'Moderator', value: `<@${userId}>`,       inline: true },
                { name: 'Target',    value: target || '—',         inline: true },
                { name: 'Reason',    value: reason || '—',         inline: false },
            )
            .setFooter({ text: guildName })
            .setTimestamp();

        await channel.send({ embeds: [embed] });
    } catch (err) {
        console.error('[LOGGER] Failed to send log:', err.message);
    }
}

module.exports = { logToChannel };