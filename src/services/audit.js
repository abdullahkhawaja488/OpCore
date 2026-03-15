const axios = require('axios');

const URL       = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN     = process.env.UPSTASH_REDIS_REST_TOKEN;
const MAX_ENTRIES = 500;

const headers = { Authorization: `Bearer ${TOKEN}` };

async function readAudit() {
    try {
        const res = await axios.get(`${URL}/get/audit`, { headers });
        const result = res.data.result;
        if (!result) return [];
        return JSON.parse(result);
    } catch {
        return [];
    }
}

async function saveAudit(entries) {
    try {
        await axios.post(`${URL}/set/audit`,
            JSON.stringify(JSON.stringify(entries)),
            { headers: { ...headers, 'Content-Type': 'application/json' } }
        );
    } catch (err) {
        console.error('[AUDIT] Failed to save audit:', err.message);
    }
}

async function logAction({ guildId, guildName, userId, username, command, target, reason }) {
    const entries = await readAudit();
    entries.unshift({
        id: Date.now(), guildId, guildName, userId, username,
        command, target: target || null, reason: reason || null,
        timestamp: new Date().toISOString(),
    });
    if (entries.length > MAX_ENTRIES) entries.splice(MAX_ENTRIES);
    await saveAudit(entries);
}

module.exports = { readAudit, logAction };