const {
    EmbedBuilder, ActionRowBuilder, ButtonBuilder,
    ButtonStyle, ChannelType, PermissionsBitField
} = require('discord.js');
const { logAction } = require('../services/audit');
const { logToChannel } = require('../services/logger');

// ── /ticket open ──────────────────────────────────────────────────────────────
async function open(interaction) {
    await interaction.deferReply({ flags: 64 });

    const { guild, user } = interaction;
    const reason = interaction.options.getString('reason') || 'No reason provided';

    // Check if user already has an open ticket
    const existing = guild.channels.cache.find(
        c => c.name === `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}` && c.type === ChannelType.GuildText
    );

    if (existing)
        return interaction.editReply(`❌ You already have an open ticket: ${existing}`);

    // Find or use the category named "Tickets" if it exists
    const category = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === 'tickets');

    const channel = await guild.channels.create({
        name: `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        type: ChannelType.GuildText,
        parent: category?.id || null,
        permissionOverwrites: [
            { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
            { id: user.id,                  allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
            { id: guild.members.me.id,      allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageChannels] },
        ],
    });

    const embed = new EmbedBuilder()
        .setColor('#5865f2')
        .setTitle('🎫 Support Ticket')
        .setDescription(`Hey <@${user.id}>, support will be with you shortly.\n\n**Reason:** ${reason}`)
        .setFooter({ text: 'Click Close Ticket when resolved.' })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ticket_close').setLabel('Close Ticket').setEmoji('🔒').setStyle(ButtonStyle.Danger),
    );

    await channel.send({ embeds: [embed], components: [row] });

    await logAction({
        guildId:   guild.id,
        guildName: guild.name,
        userId:    user.id,
        username:  user.username,
        command:   'ticket open',
        reason,
    });

    await interaction.editReply(`✅ Ticket created: ${channel}`);
}

// ── /ticket close ─────────────────────────────────────────────────────────────
async function close(interaction) {
    const { guild, channel, user } = interaction;

    if (!channel.name.startsWith('ticket-'))
        return interaction.reply({ content: '❌ This is not a ticket channel.', flags: 64 });
    // in both close() and handleTicketClose(), add this check after the channel.name check
const isOwner = channel.name === `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
const isMod   = interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels);
if (!isOwner && !isMod)
    return interaction.reply({ content: '❌ Only the ticket owner or a moderator can close this.', flags: 64 });

    await interaction.reply({ content: '🔒 Closing ticket in 5 seconds...', flags: 64 });

    await logAction({
        guildId:   guild.id,
        guildName: guild.name,
        userId:    user.id,
        username:  user.username,
        command:   'ticket close',
        target:    channel.name,
    });
    await logToChannel(interaction.client, { guildId: guild.id, guildName: guild.name, userId: user.id, username: user.username, command: 'ticket close', target: channel.name });

    setTimeout(() => channel.delete().catch(console.error), 5000);
}

// ── /ticket add ───────────────────────────────────────────────────────────────
async function add(interaction) {
    const { guild, channel } = interaction;
    const target = interaction.options.getUser('user');

    if (!channel.name.startsWith('ticket-'))
        return interaction.reply({ content: '❌ This is not a ticket channel.', flags: 64 });

    await channel.permissionOverwrites.edit(target.id, {
        ViewChannel:  true,
        SendMessages: true,
    });

    await interaction.reply({ content: `✅ Added <@${target.id}> to the ticket.`, flags: 64 });
}

// ── Button: close ticket ──────────────────────────────────────────────────────
async function handleTicketClose(interaction) {
    const { guild, channel, user } = interaction;

    if (!channel.name.startsWith('ticket-'))
        return interaction.reply({ content: '❌ Not a ticket channel.', flags: 64 });
    // in both close() and handleTicketClose(), add this check after the channel.name check
const isOwner = channel.name === `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
const isMod   = interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels);
if (!isOwner && !isMod)
    return interaction.reply({ content: '❌ Only the ticket owner or a moderator can close this.', flags: 64 });

    await interaction.reply({ content: '🔒 Closing ticket in 5 seconds...' });

    await logAction({
        guildId:   guild.id,
        guildName: guild.name,
        userId:    user.id,
        username:  user.username,
        command:   'ticket close (button)',
        target:    channel.name,
    });
    await logToChannel(interaction.client, { guildId: guild.id, guildName: guild.name, userId: user.id, username: user.username, command: 'ticket close (button)', target: channel.name });

    setTimeout(() => channel.delete().catch(console.error), 5000);
}

module.exports = { open, close, add, handleTicketClose };
