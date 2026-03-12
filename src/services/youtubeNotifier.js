require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const fs    = require('fs');
const path  = require('path');
const { readConfig } = require('./config');

function loadConfig() {
    return readConfig();
}
const YT_CHANNEL_ID   = 'UCP7WmQ_U4GB3K51Od9QvM0w';
const DISCORD_CHANNEL = '1391425953657258045';
const UPSTASH_URL   = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const POLL_INTERVAL   = 60 * 60 * 1000; // 1 hour
const RECORD_FILE     = path.join(__dirname, '../../data/seen_videos.json');
const MAX_SEEN        = 50;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

async function loadSeen() {
    const res = await axios.get(`${UPSTASH_URL}/get/seen_videos`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
    });
    return res.data.result ? JSON.parse(res.data.result) : [];
}

async function saveSeen(ids) {
    const trimmed = ids.slice(-MAX_SEEN);
   await axios.post(
   `${UPSTASH_URL}/set/seen_videos`,
   JSON.stringify(trimmed),
   {
      headers: {
         Authorization: `Bearer ${UPSTASH_TOKEN}`,
         'Content-Type': 'application/json'
      }
   }
);
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
        const config = loadConfig();
        let updated  = false;

        for (const item of items) {
            const videoId = item.id.videoId;
            if (!videoId) continue;

            if (isFirstRun) {
                // On startup: just mark everything as seen, post only the latest
                if (!seen.includes(videoId)) {
                    seen.push(videoId);
                    updated = true;
                }
                continue;
            }

            if (seen.includes(videoId)) continue;

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

            seen.push(videoId);
            updated = true;
            console.log(`[YT NOTIFIER] Posted: ${item.snippet.title}`);
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

client.login(process.env.DISCORD_TOKEN);
