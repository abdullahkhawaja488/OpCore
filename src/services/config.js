const axios = require('axios');

const URL   = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const headers = { Authorization: `Bearer ${TOKEN}` };

async function readConfig() {
    try {
        const res = await axios.get(`${URL}/get/servers`, { headers });
        const result = res.data.result;
        if (!result) return {};
        return JSON.parse(result);
    } catch {
        return {};
    }
}

async function saveConfig(data) {
    try {
        await axios.post(`${URL}/set/servers`,
            JSON.stringify(JSON.stringify(data)),
            { headers: { ...headers, 'Content-Type': 'application/json' } }
        );
    } catch (err) {
        console.error('[CONFIG] Failed to save config:', err.message);
    }
}

module.exports = { readConfig, saveConfig };