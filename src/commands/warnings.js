const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { addWarning, getWarnings, clearWarnings } = require('../services/warnings');
const { logAction } = require('../services/audit');

async function warn(interaction) {
    const { options, guild, member: executor } = interaction;
    const user   = options.getUser('user');
    const reason = options.getString('reason');

    if (!executor.permissions.has(PermissionsBitField.Flags.ModerateMembers))
        return interaction.reply({ content: '❌ You don\'t have permission to warn members.', flags: 64 });

    const warnings = addWarning(guild.id, user.id, reason, interaction.user.id);

    logAction({
        guildId:   guild.id,
        guildName: guild.name,
        userId:    interaction.user.id,
        username:  interaction.user.username,
        command:   'warn',
        target:    user.username,
        reason,
    });

    const embed = new EmbedBuilder()
        .setColor('#faa61a')
        .setTitle('⚠️ Warning Issued')
        .setDescription(`**${user.username}** has been warned.`)
        .addFields(
            { name: 'Reason',        value: reason,                    inline: true },
            { name: 'Total Warnings', value: `${warnings.length}`,    inline: true },
        )
        .setFooter({ text: `Warned by ${interaction.user.username}` })
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    // DM the user
    try {
        await user.send(`⚠️ You have been warned in **${guild.name}**.\n**Reason:** ${reason}\n**Total warnings:** ${warnings.length}`);
    } catch { /* DMs disabled */ }
}

async function warnings(interaction) {
    const user = interaction.options.getUser('user');
    const list = getWarnings(interaction.guild.id, user.id);

    if (list.length === 0)
        return interaction.reply({ content: `✅ **${user.username}** has no warnings.`, flags: 64 });

    const embed = new EmbedBuilder()
        .setColor('#faa61a')
        .setTitle(`⚠️ Warnings — ${user.username}`)
        .setDescription(list.map((w, i) =>
            `**#${i + 1}** — ${w.reason}\n↳ <t:${Math.floor(new Date(w.timestamp).getTime() / 1000)}:R>`
        ).join('\n\n'))
        .setFooter({ text: `${list.length} total warning${list.length !== 1 ? 's' : ''}` });

    await interaction.reply({ embeds: [embed], flags: 64 });
}

async function clearwarn(interaction) {
    const { options, guild, member: executor } = interaction;
    const user = options.getUser('user');

    if (!executor.permissions.has(PermissionsBitField.Flags.ModerateMembers))
        return interaction.reply({ content: '❌ You don\'t have permission to clear warnings.', flags: 64 });

    clearWarnings(guild.id, user.id);

    logAction({
        guildId:   guild.id,
        guildName: guild.name,
        userId:    interaction.user.id,
        username:  interaction.user.username,
        command:   'clearwarn',
        target:    user.username,
    });

    await interaction.reply({ content: `✅ Cleared all warnings for **${user.username}**.`, flags: 64 });
}

module.exports = { warn, warnings, clearwarn };
