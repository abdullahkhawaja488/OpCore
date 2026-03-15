require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const path  = require('path');
const { readConfig } = require('./config');
const fs = require('fs');

const YT_CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;
const UPSTASH_URL   = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const POLL_INTERVAL   = 60 * 60 * 1000; // 1 hour
const MAX_SEEN        = 50;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

async function loadSeen() {
    try {
        const res = await axios.get(`${UPSTASH_URL}/get/seen_videos`, {
            headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
        });
        const result = res.data.result;
        if (!result) return [];
        const parsed = JSON.parse(result);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

async function saveSeen(ids) {
    try {
        const trimmed = ids.slice(-MAX_SEEN);
        await axios.post(`${UPSTASH_URL}/set/seen_videos`,
            JSON.stringify(JSON.stringify(trimmed)),
            { headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, 'Content-Type': 'application/json' } }
        );
    } catch (err) {
        console.error('[YT NOTIFIER] Failed to save seen videos:', err.message);
    }
}

let isFirstRun = true;

async function checkYouTube() {
    try {
        const res = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part:       'snippet',
                channelId:  YT_CHANNEL_ID,
                maxResults: 5,
                order:      'date',
                type:       'video',
                key:        process.env.YOUTUBE_API_KEY,
            },
        });

        const items = res.data.items;
        if (!items?.length) return;

        const seen = await loadSeen();
        const config = await readConfig();
        let updated = false;

        for (const item of items) {
            const videoId = item.id.videoId;
            if (!videoId) continue;

            if (seen.includes(videoId)) continue;

            if (!isFirstRun) {
                // New video found — post it
                for (const guildConf of Object.values(config)) {
                    if (!guildConf.NOTIFY_CHANNEL) continue;
                    const channel = await client.channels.fetch(guildConf.NOTIFY_CHANNEL).catch(() => null);
                    if (channel) {
                        await channel.send(
                            `📢 **New YouTube Upload!**\n` +
                            `**${item.snippet.title}**\n` +
                            `https://youtu.be/${videoId}`
                        );
                    }
                }
                console.log(`[YT NOTIFIER] Posted: ${item.snippet.title}`);
            }

            seen.push(videoId);
            updated = true;
        }

        if (updated) await saveSeen(seen);
        isFirstRun = false;

    } catch (err) {
        console.error('[YT NOTIFIER]', err.response?.data || err);
    }
}

client.once('clientReady', () => {
    console.log(`[YT NOTIFIER] Online as ${client.user.tag}`);
    checkYouTube();
    setInterval(checkYouTube, POLL_INTERVAL);
});

// add this anywhere after the client.once('clientReady') block
const TRIGGER_PATH = path.join(__dirname, '../../data/yt_trigger');
let lastTrigger = 0;
setInterval(() => {
    try {
        const val = fs.readFileSync(TRIGGER_PATH, 'utf-8').trim();
        if (val && Number(val) > lastTrigger) {
            lastTrigger = Number(val);
            console.log('[YT NOTIFIER] Manual trigger detected, checking now...');
            checkYouTube();
        }
    } catch { /* file doesn't exist yet, ignore */ }
}, 5000);

client.login(process.env.DISCORD_TOKEN);
