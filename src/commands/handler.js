const moderation = require('./moderation');
const info       = require('./info');
const admin      = require('./admin');
const general    = require('./general');
const warningCmds = require('./warnings');
const tickets     = require('./tickets');

async function handleInteraction(client, interaction) {
    if (!interaction.guild) return;

    // ── Button interactions ───────────────────────────────────────────────────
    if (interaction.isButton()) {
        const { customId } = interaction;
        if (customId === 'ticket_close') return tickets.handleTicketClose(interaction);
        if (customId === 'premium') {
            const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('rateme').setLabel('Love it ❤').setStyle(ButtonStyle.Primary)
            );
            return interaction.reply({ components: [row], flags: 64 });
        }
        if (customId === 'rateme') {
            return interaction.reply({ content: 'Thank you!', flags: 64 });
        }
        return;
    }

    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    const routes = {
        ping:      () => general.ping(interaction),
        help:      () => general.help(interaction),
        links:     () => general.links(client, interaction),
        server:    () => general.server(client, interaction),
        banlist:   () => general.banlist(interaction),
        info:      () => info.userInfo(interaction),
        av:        () => info.avatar(interaction),
        banner:    () => info.banner(interaction),
        kick:      () => moderation.kick(interaction),
        ban:       () => moderation.ban(interaction),
        unban:     () => moderation.unban(interaction),
        tmt:       () => moderation.timeout(interaction),
        ctmt:      () => moderation.cancelTimeout(interaction),
        clear:     () => moderation.clear(interaction),
        role:      () => admin.role(interaction),
        setstatus: () => admin.setStatus(client, interaction),
        setup:     () => admin.setup(interaction),
        warn:      () => warningCmds.warn(interaction),
        warnings:  () => warningCmds.warnings(interaction),
        clearwarn: () => warningCmds.clearwarn(interaction),
        ticket:    () => {
            const sub = interaction.options.getSubcommand();
            if (sub === 'open')  return tickets.open(interaction);
            if (sub === 'close') return tickets.close(interaction);
            if (sub === 'add')   return tickets.add(interaction);
        },
    };

    const handler = routes[commandName];
    if (handler) {
        try {
            await handler();
        } catch (err) {
            console.error(`[HANDLER] Error in /${commandName}:`, err);
            const msg = { content: '❌ Something went wrong. Try again.', flags: 64 };
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply(msg).catch(() => {});
            } else {
                await interaction.reply(msg).catch(() => {});
            }
        }
    }
}

module.exports = { handleInteraction };
