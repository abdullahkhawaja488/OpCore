const { EmbedBuilder } = require('discord.js');
const { readConfig } = require('../services/config');

async function handleMemberAdd(member) {
    const config    = await readConfig();
    const guildConf = config[member.guild.id];
    if (!guildConf) return;

    if (guildConf.DEFAULT_ROLE_ID) {
        await member.roles.add(guildConf.DEFAULT_ROLE_ID).catch(err =>
            console.error('[WELCOME] Failed to assign role:', err.message)
        );
    }

    if (guildConf.MEMBER_COUNT_CHANNEL_ID) {
        const countChannel = member.guild.channels.cache.get(guildConf.MEMBER_COUNT_CHANNEL_ID);
        if (countChannel) {
            await countChannel.setName(`Members: ${member.guild.memberCount}`).catch(err =>
                console.error('[WELCOME] Failed to update member count:', err.message)
            );
        }
    }

    if (guildConf.WELCOME_CHANNEL) {
        const channel = member.guild.channels.cache.get(guildConf.WELCOME_CHANNEL);
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setColor(0x57F287)
            .setDescription(`<@${member.user.id}> joined the server.`)
            .setThumbnail(member.user.displayAvatarURL({ size: 512 }))
            .setTimestamp();

        await channel.send({ embeds: [embed] }).catch(err =>
            console.error('[WELCOME] Failed to send welcome message:', err.message)
        );
    }
}

module.exports = { handleMemberAdd };