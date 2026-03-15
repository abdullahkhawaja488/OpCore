const { EmbedBuilder } = require('discord.js');

async function userInfo(interaction) {
    await interaction.deferReply();

    const user   = interaction.options.getUser('user') || interaction.user;
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member) return interaction.editReply('❌ Could not find that member in this server.');

    const discordAge = Math.floor((Date.now() - user.createdAt.getTime()) / 86400000);
    const serverAge  = member.joinedAt
        ? Math.floor((Date.now() - member.joinedAt.getTime()) / 86400000)
        : null;
    const nickname   = member.nickname || 'None';
    const boosting   = member.premiumSince ? 'Yes 💎' : 'No';
    const avatarURL  = user.displayAvatarURL({ size: 512 });

    const embed = new EmbedBuilder()
        .setColor(0x2F3136)
        .setAuthor({ name: user.username, iconURL: avatarURL })
        .setThumbnail(avatarURL)
        .setDescription(
            `**Joined Discord:** ${discordAge} days ago\n` +
            `**Joined Server:** ${serverAge !== null ? `${serverAge} days ago` : 'Unknown'}\n` +
            `**Nickname:** ${nickname}\n` +
            `**Boosting:** ${boosting}`
        )
        .addFields(
            { name: 'Account Created', value: user.createdAt.toDateString(),                          inline: true },
            { name: 'Server Joined',   value: member.joinedAt?.toDateString() ?? 'Unknown',           inline: true },
        )
        .setFooter({ text: 'OpCore' });

    await interaction.editReply({ embeds: [embed] });
}

async function avatar(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const av   = user.displayAvatarURL({ size: 1024 });
    await interaction.reply({ files: [av] });
}

async function banner(interaction) {
    await interaction.deferReply();
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const fetched    = await interaction.client.users.fetch(targetUser.id, { force: true });
    const bannerURL  = fetched.bannerURL({ size: 1024 });

    if (!bannerURL) {
        return interaction.editReply({ content: '❌ This user has no banner.' });
    }

    const embed = new EmbedBuilder()
        .setColor(0x2F3136)
        .setAuthor({ name: fetched.username, iconURL: fetched.displayAvatarURL({ size: 64 }) })
        .setImage(bannerURL)
        .setFooter({ text: 'OpCore' });

    await interaction.editReply({ embeds: [embed] });
}

module.exports = { userInfo, avatar, banner };
