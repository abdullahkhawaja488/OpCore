const { EmbedBuilder } = require('discord.js');
const { readConfig } = require('../services/config');

async function handleMemberAdd(member) {
    const config    = readConfig();
    const guildConf = config[member.guild.id];
    if (!guildConf) return;

    // Assign default role
    if (guildConf.DEFAULT_ROLE_ID) {
        await member.roles.add(guildConf.DEFAULT_ROLE_ID).catch(err =>
            console.error('[WELCOME] Failed to assign role:', err.message)
        );
    }

    // Update member count channel name
    if (guildConf.MEMBER_COUNT_CHANNEL_ID) {
        const countChannel = member.guild.channels.cache.get(guildConf.MEMBER_COUNT_CHANNEL_ID);
        if (countChannel) {
            await countChannel.setName(`Members: ${member.guild.memberCount}`).catch(err =>
                console.error('[WELCOME] Failed to update member count:', err.message)
            );
        }
    }

    // Send welcome message
    if (guildConf.WELCOME_CHANNEL) {
        const channel = member.guild.channels.cache.get(guildConf.WELCOME_CHANNEL);
        if (!channel) return;

        const rulesChannel = guildConf.RULES_CHANNEL ? `<#${guildConf.RULES_CHANNEL}>` : 'the rules channel';

        const embed = new EmbedBuilder()
            .setColor(0x2F3136)
            .setTitle(`Welcome to ${member.guild.name}! 🎉`)
            .setDescription(
                `Hey <@${member.id}>, glad you're here!\n` +
                `Please check out ${rulesChannel} and enjoy your stay.`
            )
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
            .setFooter({ text: `Member #${member.guild.memberCount}` })
            .setTimestamp();

        await channel.send({ embeds: [embed] }).catch(err =>
            console.error('[WELCOME] Failed to send welcome message:', err.message)
        );
    }
}

module.exports = { handleMemberAdd };
