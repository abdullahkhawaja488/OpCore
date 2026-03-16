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

        const title       = guildConf.BYE_TITLE       || null;
        const description = (guildConf.BYE_DESCRIPTION || '**{username}** has left the server. 👋')
            .replace('{user}',    member.user.id)
            .replace('{username}', member.user.username)
            .replace('{server}',  member.guild.name)
            .replace('{count}',   member.guild.memberCount);
        const color = guildConf.BYE_COLOR
            ? parseInt(guildConf.BYE_COLOR.replace('#', ''), 16)
            : 0x99AAB5;

        const embed = new EmbedBuilder()
            .setColor(color)
            .setAuthor({ iconURL: member.user.displayAvatarURL({ size: 64 }) })
            .setDescription(description)
            .setTimestamp();

        if (title) embed.setTitle(title
            .replace('{username}', member.user.username)
            .replace('{server}',   member.guild.name)
            .replace('{count}',    member.guild.memberCount)
        );

        await channel.send({ embeds: [embed] }).catch(err =>
            console.error('[BYE] Failed to send goodbye message:', err.message)
        );
    }
}

module.exports = { handleMemberRemove };
