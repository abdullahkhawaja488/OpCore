const { ChannelType } = require('discord.js');

const commands = [
    // ── General ───────────────────────────────────────────────────────────────
    { name: 'ping',    description: 'Pong!' },
    { name: 'help',    description: 'Displays help information.' },
    // { name: 'links',   description: 'Links to bot connections.' },
    { name: 'server',  description: 'Displays server stats.' },
    { name: 'banlist', description: 'List of all banned users.' },

    // ── User Info ─────────────────────────────────────────────────────────────
    {
        name: 'info',
        description: 'Get information about a user.',
        options: [{ type: 6, name: 'user', description: 'Target user', required: false }],
    },
    {
        name: 'av',
        description: 'Get a user\'s avatar.',
        options: [{ type: 6, name: 'user', description: 'Target user', required: false }],
    },
    {
        name: 'banner',
        description: 'Get a user\'s banner.',
        options: [{ type: 6, name: 'user', description: 'Target user', required: false }],
    },

    // ── Moderation ────────────────────────────────────────────────────────────
    {
        name: 'kick',
        description: 'Kick a user from the server.',
        options: [
            { type: 6, name: 'user',   description: 'User to kick',   required: true },
            { type: 3, name: 'reason', description: 'Reason for kick', required: true },
        ],
    },
    {
        name: 'ban',
        description: 'Ban a user from the server.',
        options: [
            { type: 6, name: 'user',   description: 'User to ban',   required: true },
            { type: 3, name: 'reason', description: 'Reason for ban', required: true },
        ],
    },
    {
        name: 'unban',
        description: 'Unban a user by their ID.',
        options: [
            { type: 3, name: 'user_id', description: 'User ID to unban', required: true },
        ],
    },
    {
        name: 'tmt',
        description: 'Timeout a user.',
        options: [
            { type: 6, name: 'user',     description: 'User to timeout',         required: true },
            { type: 4, name: 'duration', description: 'Duration in seconds',      required: true },
            { type: 3, name: 'reason',   description: 'Reason for timeout',       required: false },
        ],
    },
    {
        name: 'ctmt',
        description: 'Cancel a user\'s timeout.',
        options: [
            { type: 6, name: 'user', description: 'User to un-timeout', required: true },
        ],
    },
    {
        name: 'clear',
        description: 'Bulk delete messages from a channel.',
        options: [
            { type: 4, name: 'amount', description: 'Number of messages (1–100)', required: true },
        ],
    },

    // ── Admin ─────────────────────────────────────────────────────────────────
    {
        name: 'role',
        description: 'Give or take a role from a user.',
        options: [
            { type: 6, name: 'user',   description: 'Target user',        required: true },
            { type: 8, name: 'role',   description: 'Role to give/take',   required: true },
            {
                type: 3, name: 'action', description: 'Give or Take', required: true,
                choices: [{ name: 'Give', value: 'give' }, { name: 'Take', value: 'take' }],
            },
        ],
    },
    {
        name: 'setstatus',
        description: 'Change the bot\'s status. (Owner only)',
        options: [
            {
                type: 3, name: 'type', description: 'Activity type', required: true,
                choices: [
                    { name: 'Playing',   value: 'playing'   },
                    { name: 'Listening', value: 'listening' },
                    { name: 'Watching',  value: 'watching'  },
                    { name: 'Competing', value: 'competing' },
                    { name: 'Custom',    value: 'custom'    },
                ],
            },
            { type: 3, name: 'message', description: 'Status text', required: true },
        ],
    },
    {
        name: 'setup',
        description: 'Configure server channels and roles. (Owner only)',
        options: [
            { type: 7, name: 'welcome', description: 'Welcome channel',      required: true },
            { type: 7, name: 'bye',     description: 'Goodbye channel',      required: true },
            { type: 7, name: 'member',  description: 'Member count channel', required: true },
            { type: 7, name: 'rules',   description: 'Rules channel',        required: true },
            { type: 8, name: 'role',    description: 'Default member role',  required: true },
            { type: 7, name: 'log',     description: 'Mod log channel',      required: true },
        ],
    },
    // ── Warnings ──────────────────────────────────────────────────────────────
    {
        name: 'warn',
        description: 'Warn a user.',
        options: [
            { type: 6, name: 'user',   description: 'User to warn',    required: true },
            { type: 3, name: 'reason', description: 'Reason for warn', required: true },
        ],
    },
    {
        name: 'warnings',
        description: 'View warnings for a user.',
        options: [{ type: 6, name: 'user', description: 'Target user', required: true }],
    },
    {
        name: 'clearwarn',
        description: 'Clear all warnings for a user.',
        options: [{ type: 6, name: 'user', description: 'Target user', required: true }],
    },

    // ── Tickets ───────────────────────────────────────────────────────────────
    {
        name: 'ticket',
        description: 'Manage support tickets.',
        options: [
            {
                type: 1, name: 'open', description: 'Open a new ticket.',
                options: [{ type: 3, name: 'reason', description: 'Reason', required: false }],
            },
            { type: 1, name: 'close', description: 'Close this ticket.' },
            {
                type: 1, name: 'add', description: 'Add a user to this ticket.',
                options: [{ type: 6, name: 'user', description: 'User to add', required: true }],
            },
        ],
    },
];

function getAllCommands() {
    return commands;
}

module.exports = { getAllCommands };
