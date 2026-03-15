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

    // Declare countChannel at function scope so it's accessible below
    let countChannel = null;
    if (guildConf.MEMBER_COUNT_CHANNEL_ID) {
        countChannel = member.guild.channels.cache.get(guildConf.MEMBER_COUNT_CHANNEL_ID);
        if (countChannel) {
            const baseName = countChannel.name.split(':')[0] || 'Members';
            await countChannel.setName(`${baseName}: ${member.guild.memberCount}`).catch(err =>
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
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
            .setTimestamp();

        await channel.send({ embeds: [embed] });
    }
}

module.exports = { handleMemberAdd };