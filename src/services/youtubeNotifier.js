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
const POLL_INTERVAL   = 60 * 60 * 1000; // 1 hour
const RECORD_FILE     = path.join(__dirname, '../../data/seen_videos.json');
const MAX_SEEN        = 50;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

function loadSeen() {
    if (!fs.existsSync(RECORD_FILE)) return [];
    const raw = fs.readFileSync(RECORD_FILE, 'utf-8').trim();
    if (!raw) return [];
    return JSON.parse(raw);
}

function saveSeen(ids) {
    // Keep only the last MAX_SEEN to prevent infinite growth
    const trimmed = ids.slice(-MAX_SEEN);
    fs.writeFileSync(RECORD_FILE, JSON.stringify(trimmed, null, 2));
}

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

        const seen   = loadSeen();
        const config = loadConfig();
        let updated  = false;

        for (const item of items) {
            const videoId = item.id.videoId;
            if (!videoId || seen.includes(videoId)) continue;

            // Post to every server that has a notify channel set
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

        if (updated) saveSeen(seen);
    } catch (err) {
        console.error('[YT NOTIFIER] Error:', err.message);
    }
}

client.once('clientReady', () => {
    console.log(`[YT NOTIFIER] Online as ${client.user.tag}`);
    checkYouTube();
    setInterval(checkYouTube, POLL_INTERVAL);
});

client.login(process.env.DISCORD_TOKEN);
