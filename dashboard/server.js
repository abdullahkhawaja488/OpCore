require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express      = require('express');
const session      = require('express-session');
const axios        = require('axios');
const path         = require('path');
const fs           = require('fs');
const { readConfig, saveConfig } = require('../src/services/config');
const { readAudit }              = require('../src/services/audit');
const { readWarnings }           = require('../src/services/warnings');

const app  = express();
const PORT = process.env.DASHBOARD_PORT || 4000;

const OWNER_ID      = process.env.OWNER_ID;
const CLIENT_ID     = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI  = process.env.DASHBOARD_REDIRECT_URI || `http://localhost:${PORT}/auth/callback`;
const LOG_PATH      = path.join(__dirname, '../data/dashboard.log');

// ── Ensure data/ directory exists ─────────────────────────────────────────────
const DATA_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ── In-memory log ring buffer (last 200 lines) ────────────────────────────────
const logs = [];
function pushLog(level, msg) {
    const entry = { time: new Date().toISOString(), level, msg };
    logs.push(entry);
    if (logs.length > 200) logs.shift();
    try { fs.appendFileSync(LOG_PATH, JSON.stringify(entry) + '\n'); } catch { /* ignore */ }
}

// Intercept console for log capture
const _log   = console.log.bind(console);
const _error = console.error.bind(console);
console.log   = (...a) => { _log(...a);   pushLog('info',  a.join(' ')); };
console.error = (...a) => { _error(...a); pushLog('error', a.join(' ')); };

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret:            process.env.SESSION_SECRET || (() => { throw new Error('[DASHBOARD] SESSION_SECRET is not set in .env'); })(),
    resave:            false,
    saveUninitialized: false,
    cookie:            { secure: false, maxAge: 24 * 60 * 60 * 1000 },
}));

// ── Auth guard ────────────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
    if (req.session?.user?.id === OWNER_ID) return next();
    res.status(401).json({ error: 'Unauthorized' });
}

// ── Discord OAuth ─────────────────────────────────────────────────────────────
app.get('/auth/login', (req, res) => {
    const params = new URLSearchParams({
        client_id:     CLIENT_ID,
        redirect_uri:  REDIRECT_URI,
        response_type: 'code',
        scope:         'identify',
    });
    res.redirect(`https://discord.com/oauth2/authorize?${params}`);
});

app.get('/auth/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.redirect('/login.html?error=no_code');

    try {
        const tokenRes = await axios.post('https://discord.com/api/oauth2/token',
            new URLSearchParams({
                client_id:     CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type:    'authorization_code',
                code,
                redirect_uri:  REDIRECT_URI,
            }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        const userRes = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${tokenRes.data.access_token}` },
        });

        const user = userRes.data;

        if (user.id !== OWNER_ID) {
            return res.redirect('/login.html?error=unauthorized');
        }

        req.session.user = { id: user.id, username: user.username, avatar: user.avatar };
        res.redirect('/');
    } catch (err) {
        console.error('[DASHBOARD] OAuth error:', err.message);
        res.redirect('/login.html?error=oauth_failed');
    }
});

app.get('/auth/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login.html');
    });
});

app.get('/auth/me', (req, res) => {
    if (req.session?.user?.id === OWNER_ID) {
        res.json(req.session.user);
    } else {
        res.status(401).json({ error: 'Not logged in' });
    }
});

// ── API: Servers ──────────────────────────────────────────────────────────────
app.get('/api/servers', requireAuth, async (req, res) => {
    try {
        const data = await readConfig();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/servers/:guildId', requireAuth, async (req, res) => {
    try {
        const data        = await readConfig();
        const { guildId } = req.params;

        if (!data[guildId]) return res.status(404).json({ error: 'Guild not found' });

        const allowed = ['WELCOME_CHANNEL', 'BYE_CHANNEL', 'MEMBER_COUNT_CHANNEL_ID', 'RULES_CHANNEL', 'DEFAULT_ROLE_ID', 'LOG_CHANNEL'];
        for (const key of allowed) {
            if (req.body[key] !== undefined) {
                data[guildId][key] = req.body[key];
            }
        }

        data[guildId].updatedAt = new Date().toISOString();
        await saveConfig(data);
        console.log(`[DASHBOARD] Updated config for guild ${guildId}`);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── API: Logs ─────────────────────────────────────────────────────────────────
app.get('/api/logs', requireAuth, (req, res) => {
    res.json(logs);
});

// SSE stream for live logs
app.get('/api/logs/stream', requireAuth, (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    res.write(`data: ${JSON.stringify({ type: 'init', logs })}\n\n`);

    let lastLen = logs.length;
    const interval = setInterval(() => {
        if (logs.length > lastLen) {
            const newLogs = logs.slice(lastLen);
            lastLen = logs.length;
            try {
                res.write(`data: ${JSON.stringify({ type: 'new', logs: newLogs })}\n\n`);
            } catch {
                clearInterval(interval);
            }
        }
    }, 1000);

    req.on('close', () => clearInterval(interval));
});

// ── API: Audit log ────────────────────────────────────────────────────────────
app.get('/api/audit', requireAuth, async (req, res) => {
    try {
        const data = await readAudit();
        const { guild, limit = 200 } = req.query;
        const filtered = guild ? data.filter(e => e.guildId === guild) : data;
        res.json(filtered.slice(0, parseInt(limit)));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── API: Warnings ─────────────────────────────────────────────────────────────
app.get('/api/warnings', requireAuth, async (req, res) => {
    try {
        const data = await readWarnings();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── API: Stats ────────────────────────────────────────────────────────────────
app.get('/api/stats', requireAuth, async (req, res) => {
    try {
        const servers  = await readConfig();
        const audit    = await readAudit();
        const warnings = await readWarnings();
        const totalWarnings = Object.values(warnings).reduce((a, g) =>
            a + Object.values(g).reduce((b, u) => b + u.length, 0), 0);
        res.json({
            serverCount:   Object.keys(servers).length,
            auditCount:    audit.length,
            totalWarnings,
            logCount:      logs.length,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── API: Set bot status ───────────────────────────────────────────────────────
app.post('/api/setstatus', requireAuth, (req, res) => {
    const { type, message } = req.body;
    if (!type || !message) return res.status(400).json({ error: 'Missing fields' });
    const triggerPath = path.join(__dirname, '../data/status_trigger.json');
    fs.writeFileSync(triggerPath, JSON.stringify({ type, message }));
    console.log(`[DASHBOARD] Status trigger: ${type} - ${message}`);
    res.json({ ok: true });
});

// ── Catch-all: serve dashboard or login ──────────────────────────────────────
app.get('/', (req, res) => {
    if (req.session?.user?.id === OWNER_ID) {
        res.sendFile(path.join(__dirname, 'public/index.html'));
    } else {
        res.redirect('/login.html');
    }
});

app.listen(PORT, () => {
    console.log(`[DASHBOARD] Running at http://localhost:${PORT}`);
});