const fs   = require('fs');
const path = require('path');

const WARN_PATH = path.join(__dirname, '../../data/warnings.json');

function readWarnings() {
    if (!fs.existsSync(WARN_PATH)) return {};
    const raw = fs.readFileSync(WARN_PATH, 'utf-8').trim();
    if (!raw) return {};
    return JSON.parse(raw);
}

function saveWarnings(data) {
    fs.writeFileSync(WARN_PATH, JSON.stringify(data, null, 2));
}

function addWarning(guildId, userId, reason, moderatorId) {
    const data = readWarnings();
    if (!data[guildId]) data[guildId] = {};
    if (!data[guildId][userId]) data[guildId][userId] = [];
    data[guildId][userId].push({
        id:          Date.now(),
        reason,
        moderatorId,
        timestamp:   new Date().toISOString(),
    });
    saveWarnings(data);
    return data[guildId][userId];
}

function getWarnings(guildId, userId) {
    const data = readWarnings();
    return data[guildId]?.[userId] || [];
}

function clearWarnings(guildId, userId) {
    const data = readWarnings();
    if (data[guildId]?.[userId]) {
        delete data[guildId][userId];
        saveWarnings(data);
    }
}

module.exports = { addWarning, getWarnings, clearWarnings, readWarnings };
