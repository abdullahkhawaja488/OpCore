const { PermissionsBitField } = require('discord.js');

// ── kick ──────────────────────────────────────────────────────────────────────
async function kick(interaction) {
    await interaction.deferReply({ flags: 64 });

    const { options, guild, member: executor } = interaction;
    const user   = options.getUser('user');
    const reason = options.getString('reason') || 'No reason provided';

    if (!executor.permissions.has(PermissionsBitField.Flags.KickMembers))
        return interaction.editReply('❌ You don\'t have permission to kick members.');

    if (!guild.members.me.permissions.has(PermissionsBitField.Flags.KickMembers))
        return interaction.editReply('❌ I don\'t have permission to kick members.');

    const target = await guild.members.fetch(user.id).catch(() => null);
    if (!target) return interaction.editReply('❌ That user is not in this server.');

    if (target.roles.highest.position >= executor.roles.highest.position)
        return interaction.editReply('❌ You cannot kick someone with an equal or higher role.');

    if (target.roles.highest.position >= guild.members.me.roles.highest.position)
        return interaction.editReply('❌ I cannot kick someone with an equal or higher role than me.');

    await target.kick(reason);
    logAction({ guildId: guild.id, guildName: guild.name, userId: interaction.user.id, username: interaction.user.username, command: 'kick', target: user.username, reason });

    if (!target.user.bot) {
        try {
            const invite = await interaction.channel.createInvite({ maxAge: 604800, maxUses: 5, unique: true });
            await user.send(`Hey <@${user.id}>,\nYou've been kicked from **${guild.name}**.\n**Reason:** ${reason}\nRejoin: ${invite.url}`);
        } catch {
            await interaction.followUp({ content: `⚠️ Couldn't DM ${user.username} (DMs may be disabled).`, flags: 64 });
        }
    }

    await interaction.editReply(`✅ **${user.username}** has been kicked.\n**Reason:** ${reason}`);
}

// ── ban ───────────────────────────────────────────────────────────────────────
async function ban(interaction) {
    await interaction.deferReply({ flags: 64 });

    const { options, guild, member: executor } = interaction;
    const user   = options.getUser('user');
    const reason = options.getString('reason') || 'No reason provided';

    if (!executor.permissions.has(PermissionsBitField.Flags.BanMembers))
        return interaction.editReply('❌ You don\'t have permission to ban members.');

    if (!guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers))
        return interaction.editReply('❌ I don\'t have permission to ban members.');

    // Role check only if they're still in the server
    const target = await guild.members.fetch(user.id).catch(() => null);
    if (target) {
        if (target.roles.highest.position >= executor.roles.highest.position)
            return interaction.editReply('❌ You cannot ban someone with an equal or higher role.');
        if (target.roles.highest.position >= guild.members.me.roles.highest.position)
            return interaction.editReply('❌ I cannot ban someone with an equal or higher role than me.');
    }

    if (!user.bot) {
        try {
            await user.send(`Hey <@${user.id}>,\nYou've been banned from **${guild.name}**.\n**Reason:** ${reason}`);
        } catch { /* DMs disabled, continue */ }
    }

    await guild.members.ban(user.id, { reason });
    logAction({ guildId: guild.id, guildName: guild.name, userId: interaction.user.id, username: interaction.user.username, command: 'ban', target: user.username, reason });
    await interaction.editReply(`✅ **${user.username}** has been banned.\n**Reason:** ${reason}`);
}

// ── unban ─────────────────────────────────────────────────────────────────────
async function unban(interaction) {
    await interaction.deferReply({ flags: 64 });

    const { options, guild, member: executor } = interaction;
    const userId = options.getString('user_id');

    if (!executor.permissions.has(PermissionsBitField.Flags.BanMembers))
        return interaction.editReply('❌ You don\'t have permission to unban members.');

    const bannedUsers = await guild.bans.fetch();
    if (!bannedUsers.has(userId))
        return interaction.editReply('❌ That user is not banned.');

    await guild.bans.remove(userId);
    logAction({ guildId: guild.id, guildName: guild.name, userId: interaction.user.id, username: interaction.user.username, command: 'unban', target: user?.username ?? userId });
    const user = await interaction.client.users.fetch(userId).catch(() => null);

    if (user && !user.bot) {
        try {
            const invite = await interaction.channel.createInvite({ maxAge: 604800, maxUses: 5, unique: true });
            await user.send(`Hey <@${userId}>,\nYou've been unbanned from **${guild.name}**!\nRejoin: ${invite.url}`);
        } catch { /* DMs disabled */ }
    }

    await interaction.editReply(`✅ **${user?.username ?? userId}** has been unbanned.`);
}

// ── timeout ───────────────────────────────────────────────────────────────────
async function timeout(interaction) {
    const { options, guild, member: executor } = interaction;
    const user     = options.getUser('user');
    const duration = options.getInteger('duration'); // seconds

    if (!executor.permissions.has(PermissionsBitField.Flags.ModerateMembers))
        return interaction.reply({ content: '❌ You don\'t have permission to timeout members.', flags: 64 });

    const target = await guild.members.fetch(user.id).catch(() => null);
    if (!target) return interaction.reply({ content: '❌ User not found.', flags: 64 });

    await target.timeout(duration * 1000, 'Timed out by bot');
    logAction({ guildId: guild.id, guildName: guild.name, userId: interaction.user.id, username: interaction.user.username, command: 'tmt', target: user.username, reason: `${duration}s` });
    await interaction.reply({ content: `⏱️ **${user.username}** has been timed out for **${duration} seconds**.`, flags: 64 });
}

// ── cancelTimeout ─────────────────────────────────────────────────────────────
async function cancelTimeout(interaction) {
    const { options, guild, member: executor } = interaction;
    const user = options.getUser('user');

    if (!executor.permissions.has(PermissionsBitField.Flags.ModerateMembers))
        return interaction.reply({ content: '❌ You don\'t have permission to cancel timeouts.', flags: 64 });

    const target = await guild.members.fetch(user.id).catch(() => null);
    if (!target) return interaction.reply({ content: '❌ User not found.', flags: 64 });

    await target.timeout(null);
    await interaction.reply({ content: `✅ **${user.username}**'s timeout has been cancelled.`, flags: 64 });
}

// ── clear ─────────────────────────────────────────────────────────────────────
async function clear(interaction) {
    const amount = interaction.options.getInteger('amount');

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
        return interaction.reply({ content: '❌ You don\'t have permission to delete messages.', flags: 64 });

    if (amount < 1 || amount > 100)
        return interaction.reply({ content: '❌ Please enter a number between 1 and 100.', flags: 64 });

    await interaction.channel.bulkDelete(amount, true);
    logAction({ guildId: interaction.guild.id, guildName: interaction.guild.name, userId: interaction.user.id, username: interaction.user.username, command: 'clear', reason: `${amount} messages` });
    await interaction.reply({ content: `🗑️ Deleted **${amount}** messages.`, flags: 64 });
}

module.exports = { kick, ban, unban, timeout, cancelTimeout, clear };
