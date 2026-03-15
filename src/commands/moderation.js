const { PermissionsBitField } = require('discord.js');
const { logAction } = require('../services/audit');
const { logToChannel } = require('../services/logger');
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

    // ✅ fix: DM before kick so user is still in server when DM is sent
    if (!target.user.bot) {
        try {
            const textChannel = guild.channels.cache.find(
                c => c.isTextBased() && c.permissionsFor(guild.members.me)?.has('CreateInstantInvite')
            );
            const invite = textChannel
                ? await textChannel.createInvite({ maxAge: 604800, maxUses: 5, unique: true }).catch(() => null)
                : null;
            const rejoin = invite ? `\nRejoin: ${invite.url}` : '';
            await user.send(`Hey <@${user.id}>,\nYou've been kicked from **${guild.name}**.\n**Reason:** ${reason}${rejoin}`);
        } catch {
            await interaction.followUp({ content: `⚠️ Couldn't DM ${user.username} (DMs may be disabled).`, flags: 64 });
        }
    }

    await target.kick(reason);
    await logAction({ guildId: guild.id, guildName: guild.name, userId: interaction.user.id, username: interaction.user.username, command: 'kick', target: user.username, reason });
   await logToChannel(interaction.client, { guildId: guild.id, guildName: guild.name, userId: interaction.user.id, username: interaction.user.username, command: 'kick', target: user.username, reason });
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
    await logAction({ guildId: guild.id, guildName: guild.name, userId: interaction.user.id, username: interaction.user.username, command: 'ban', target: user.username, reason });
    await logToChannel(interaction.client, { guildId: guild.id, guildName: guild.name, userId: interaction.user.id, username: interaction.user.username, command: 'ban', target: user.username, reason });
    await interaction.editReply(`✅ **${user.username}** has been banned.\n**Reason:** ${reason}`);
}

// ── unban ─────────────────────────────────────────────────────────────────────
async function unban(interaction) {
    await interaction.deferReply({ flags: 64 });

    const { options, guild, member: executor } = interaction;
    const userId = options.getString('user_id');

    if (!executor.permissions.has(PermissionsBitField.Flags.BanMembers))
        return interaction.editReply('❌ You don\'t have permission to unban members.');

    // ✅ fix: validate ID format before hitting API
    if (!/^\d{17,19}$/.test(userId))
        return interaction.editReply('❌ Invalid user ID format.');

    // ✅ fix: fetch single ban instead of all bans (avoids 1000-entry pagination cap)
    const ban = await guild.bans.fetch(userId).catch(() => null);
    if (!ban) return interaction.editReply('❌ That user is not banned.');

    // ✅ fix: fetch user BEFORE logAction so it's defined
    const user = await interaction.client.users.fetch(userId).catch(() => null);

    await guild.bans.remove(userId);
    await logAction({ guildId: guild.id, guildName: guild.name, userId: interaction.user.id, username: interaction.user.username, command: 'unban', target: user?.username ?? userId });
await logToChannel(interaction.client, { guildId: guild.id, guildName: guild.name, userId: interaction.user.id, username: interaction.user.username, command: 'unban', target: user?.username ?? userId });
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
    // ✅ fix: added deferReply to avoid interaction expiry
    await interaction.deferReply({ flags: 64 });

    const { options, guild, member: executor } = interaction;
    const user     = options.getUser('user');
    const duration = options.getInteger('duration');
    const reason   = options.getString('reason') || 'No reason provided'; // ✅ fix: now accepts reason

    if (!executor.permissions.has(PermissionsBitField.Flags.ModerateMembers))
        return interaction.editReply('❌ You don\'t have permission to timeout members.');

    const target = await guild.members.fetch(user.id).catch(() => null);
    if (!target) return interaction.editReply('❌ User not found.');

    const MAX_TIMEOUT = 28 * 24 * 60 * 60; // 28 days in seconds
    if (duration < 1 || duration > MAX_TIMEOUT)
        return interaction.editReply(`❌ Duration must be between 1 and ${MAX_TIMEOUT} seconds (28 days max).`);

    await target.timeout(duration * 1000, reason);
    await logAction({ guildId: guild.id, guildName: guild.name, userId: interaction.user.id, username: interaction.user.username, command: 'tmt', target: user.username, reason: `${duration}s — ${reason}` });
    await logToChannel(interaction.client, { guildId: guild.id, guildName: guild.name, userId: interaction.user.id, username: interaction.user.username, command: 'tmt', target: user.username, reason: `${duration}s — ${reason}` });

    await interaction.editReply(`⏱️ **${user.username}** has been timed out for **${duration} seconds**.\n**Reason:** ${reason}`);
}

// ── cancelTimeout ─────────────────────────────────────────────────────────────
async function cancelTimeout(interaction) {
    // ✅ fix: added deferReply to avoid interaction expiry
    await interaction.deferReply({ flags: 64 });

    const { options, guild, member: executor } = interaction;
    const user = options.getUser('user');

    if (!executor.permissions.has(PermissionsBitField.Flags.ModerateMembers))
        return interaction.editReply('❌ You don\'t have permission to cancel timeouts.');

    const target = await guild.members.fetch(user.id).catch(() => null);
    if (!target) return interaction.editReply('❌ User not found.');

    await target.timeout(null);

    // ✅ fix: added missing logAction call
    await logAction({ guildId: guild.id, guildName: guild.name, userId: interaction.user.id, username: interaction.user.username, command: 'cancel_timeout', target: user.username });
    await logToChannel(interaction.client, { guildId: guild.id, guildName: guild.name, userId: interaction.user.id, username: interaction.user.username, command: 'cancel_timeout', target: user.username });
    await interaction.editReply(`✅ **${user.username}**'s timeout has been cancelled.`);
}

// ── clear ─────────────────────────────────────────────────────────────────────
async function clear(interaction) {
    await interaction.deferReply({ flags: 64 });

    const amount = interaction.options.getInteger('amount');

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
        return interaction.editReply('❌ You don\'t have permission to delete messages.');

    if (amount < 1 || amount > 100)
        return interaction.editReply('❌ Please enter a number between 1 and 100.');

    const deleted = await interaction.channel.bulkDelete(amount, true);
    await logAction({ guildId: interaction.guild.id, guildName: interaction.guild.name, userId: interaction.user.id, username: interaction.user.username, command: 'clear', reason: `${deleted.size} messages` });
    await logToChannel(interaction.client, { guildId: interaction.guild.id, guildName: interaction.guild.name, userId: interaction.user.id, username: interaction.user.username, command: 'clear', reason: `${deleted.size} messages` });
    await interaction.editReply(`🗑️ Deleted **${deleted.size}** messages.`);
}

module.exports = { kick, ban, unban, timeout, cancelTimeout, clear };
