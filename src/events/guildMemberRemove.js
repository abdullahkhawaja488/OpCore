const { EmbedBuilder } = require('discord.js');
const { readConfig } = require('../services/config');

async function handleMemberRemove(member) {
    const config    = await readConfig();
    const guildConf = config[member.guild.id];
    if (!guildConf) return;

    // Declare countChannel at function scope so it's accessible below
    let countChannel = null;
    if (guildConf.MEMBER_COUNT_CHANNEL_ID) {
        countChannel = member.guild.channels.cache.get(guildConf.MEMBER_COUNT_CHANNEL_ID);
        if (countChannel) {
            const baseName = countChannel.name.split(':')[0] || 'Members';
            await countChannel.setName(`${baseName}: ${member.guild.memberCount}`).catch(err =>
                console.error('[BYE] Failed to update member count:', err.message)
            );
        }
    }

    if (guildConf.BYE_CHANNEL) {
        const channel = member.guild.channels.cache.get(guildConf.BYE_CHANNEL);
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setColor(0x99AAB5)
            .setDescription(`**${member.user.tag}** has left the server. 👋`)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
            .setFooter({ text: `Members: ${member.guild.memberCount}` })
            .setTimestamp();

        await channel.send({ embeds: [embed] });
    }
}

module.exports = { handleMemberRemove };