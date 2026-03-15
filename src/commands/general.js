const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

async function ping(interaction) {
    await interaction.reply({ content: 'Pong! 🏓', flags: 64 });
}

async function help(interaction) {
    await interaction.reply({ content: 'Contact Staff!', flags: 64 });
}

async function links(client, interaction) {
    const avatarURL = client.user.displayAvatarURL({ size: 512 });

    const embed = new EmbedBuilder()
        .setColor(0x2F3136)
        .setAuthor({ name: 'OpCore', iconURL: avatarURL });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel('Discord').setStyle(ButtonStyle.Link).setURL('https://discord.gg/czpk'),
        new ButtonBuilder().setLabel('Website').setStyle(ButtonStyle.Link).setURL('https://abdullahboostingservices.vercel.app/'),
    );

    await interaction.reply({ embeds: [embed], components: [row] });
}

async function server(client, interaction) {
    await interaction.deferReply();

    const guild = interaction.guild;

    const totalChannels = guild.channels.cache.size;
    const totalRoles    = guild.roles.cache.size;
    const serverOwner   = await guild.fetchOwner();
    const ownerName     = serverOwner.displayName || serverOwner.user.username;
    await guild.members.fetch({ limit: 1000 }).catch(() => {});
    const adminCount = guild.members.cache.filter(m => m.permissions.has(PermissionFlagsBits.Administrator)).size;
    const latency       = Date.now() - interaction.createdTimestamp;
    const apiLatency    = Math.round(client.ws.ping);

    const embed = new EmbedBuilder()
        .setColor(0x2F3136)
        .setAuthor({ name: guild.name.toUpperCase() })
        .setThumbnail(guild.iconURL({ size: 1024 }))
        .addFields(
            { name: 'Owner',       value: ownerName,                      inline: true },
            { name: 'Admins',      value: `${adminCount}`,                inline: true },
            { name: 'Channels',    value: `${totalChannels}`,             inline: true },
            { name: 'Roles',       value: `${totalRoles}`,                inline: true },
            { name: 'Created',     value: guild.createdAt.toDateString(), inline: false },
            { name: 'Latency',     value: `${latency}ms`,                 inline: true },
            { name: 'API Latency', value: `${apiLatency}ms`,              inline: true },
        )
        .setFooter({ text: 'OpCore' })
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
}

async function banlist(interaction) {
    await interaction.deferReply({ flags: 64 });

    const bans = await interaction.guild.bans.fetch({ limit: 1000 });

    if (bans.size === 0)
        return interaction.editReply('No banned users in this server.');

    let description = '';
    bans.forEach(({ user, reason }) => {
        description += `${user.bot ? '🤖' : '👤'} **${user.username}** (${user.id})\n`;
        if (reason) description += `↳ Reason: ${reason}\n`;
        description += '\n';
    });

    // Discord embed description limit is 4096 chars — truncate with notice if needed
    const LIMIT = 4000;
    let truncated = false;
    if (description.length > LIMIT) {
        description = description.slice(0, LIMIT);
        // cut at last newline to avoid splitting a line
        description = description.slice(0, description.lastIndexOf('\n'));
        truncated = true;
    }

    const embed = new EmbedBuilder()
        .setTitle('🔨 Banned Users')
        .setColor('#ff0000')
        .setDescription(description)
        .setFooter({ text: `${bans.size} total ban${bans.size !== 1 ? 's' : ''}${truncated ? ' — list truncated' : ''}` });

    await interaction.editReply({ embeds: [embed] });
    if (bans.size === 1000)
        await interaction.followUp({ content: '⚠️ Only showing first 1000 bans.', flags: 64 }).catch(() => {});
}

module.exports = { ping, help, links, server, banlist };
