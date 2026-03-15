const { EmbedBuilder } = require('discord.js');
const { readConfig } = require('../services/config');

async function handleMemberRemove(member) {
    const config    = await readConfig();
    const guildConf = config[member.guild.id];
    if (!guildConf) return;

    // Update member count channel name
    if (guildConf.MEMBER_COUNT_CHANNEL_ID) {
        const countChannel = member.guild.channels.cache.get(guildConf.MEMBER_COUNT_CHANNEL_ID);
        if (countChannel) {
            await countChannel.setName(`Members: ${member.guild.memberCount}`).catch(err =>
                console.error('[BYE] Failed to update member count:', err.message)
            );
        }
    }

    // Send goodbye message
    if (guildConf.BYE_CHANNEL) {
        const channel = member.guild.channels.cache.get(guildConf.BYE_CHANNEL);
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setColor(0x99AAB5)
            .setDescription(`**${member.user.tag}** has left the server. 👋`)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
            .setFooter({ text: `Members: ${member.guild.memberCount}` })
            .setTimestamp();

        await channel.send({ embeds: [embed] }).catch(err =>
            console.error('[BYE] Failed to send goodbye message:', err.message)
        );
    }
}

module.exports = { handleMemberRemove };
