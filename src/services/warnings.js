const axios = require('axios');

const URL   = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const headers = { Authorization: `Bearer ${TOKEN}` };

async function readWarnings() {
    try {
        const res = await axios.get(`${URL}/get/warnings`, { headers });
        const result = res.data.result;
        if (!result) return {};
        return JSON.parse(result);
    } catch {
        return {};
    }
}

async function saveWarnings(data) {
    try {
        await axios.post(`${URL}/set/warnings`,
            JSON.stringify(data),
            { headers: { ...headers, 'Content-Type': 'application/json' } }
        );
    } catch (err) {
        console.error('[WARNINGS] Failed to save warnings:', err.message);
    }
}

async function addWarning(guildId, userId, reason, moderatorId) {
    const data = await readWarnings();
    if (!data[guildId]) data[guildId] = {};
    if (!data[guildId][userId]) data[guildId][userId] = [];
    data[guildId][userId].push({
        id:          Date.now(),
        reason,
        moderatorId,
        timestamp:   new Date().toISOString(),
    });
    await saveWarnings(data);
    return data[guildId][userId];
}

async function getWarnings(guildId, userId) {
    const data = await readWarnings();
    return data[guildId]?.[userId] || [];
}

async function clearWarnings(guildId, userId) {
    const data = await readWarnings();
    if (data[guildId]?.[userId]) {
        delete data[guildId][userId];
        await saveWarnings(data);
    }
}

module.exports = { addWarning, getWarnings, clearWarnings, readWarnings };