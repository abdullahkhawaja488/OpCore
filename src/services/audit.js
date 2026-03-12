const fs   = require('fs');
const path = require('path');

const AUDIT_PATH = path.join(__dirname, '../../data/audit.json');
const MAX_ENTRIES = 500;

function readAudit() {
    if (!fs.existsSync(AUDIT_PATH)) return [];
    const raw = fs.readFileSync(AUDIT_PATH, 'utf-8').trim();
    if (!raw) return [];
    return JSON.parse(raw);
}

function saveAudit(entries) {
    fs.writeFileSync(AUDIT_PATH, JSON.stringify(entries, null, 2));
}

function logAction({ guildId, guildName, userId, username, command, target, reason }) {
    const entries = readAudit();
    entries.unshift({
        id:        Date.now(),
        guildId,
        guildName,
        userId,
        username,
        command,
        target:    target || null,
        reason:    reason || null,
        timestamp: new Date().toISOString(),
    });
    // Keep only latest MAX_ENTRIES
    if (entries.length > MAX_ENTRIES) entries.splice(MAX_ENTRIES);
    saveAudit(entries);
}

module.exports = { readAudit, logAction };
