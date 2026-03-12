# OpCore 🤖

A powerful, multi-server Discord bot built for **The Eagnibals** — featuring moderation, server management, YouTube notifications, and a private web dashboard.

---

## Features

**Moderation**
- `/kick`, `/ban`, `/unban` — with automatic DMs and rejoin invites
- `/tmt`, `/ctmt` — timeout and cancel timeout
- `/clear` — bulk delete up to 100 messages

**Server Management**
- `/setup` — configure welcome, goodbye, rules, member count channels and default role per server
- `/role` — give or take roles from users
- `/setstatus` — change the bot's activity status

**Info Commands**
- `/info` — user profile, join dates, boost status
- `/av` — fetch any user's avatar
- `/banner` — fetch any user's banner
- `/server` — server stats including latency, roles, channels
- `/banlist` — view all banned users

**YouTube Notifier**
- Polls a YouTube channel every hour for new uploads
- Posts to a configured channel per server
- Keeps a record so the same video is never posted twice

**Web Dashboard** *(Owner only)*
- Login with Discord OAuth2
- View and edit per-server configurations
- Live log stream
- Manually trigger a YouTube check

---

## Tech Stack

- [Discord.js](https://discord.js.org/) v14
- [Node.js](https://nodejs.org/) v20+
- [Express](https://expressjs.com/) — dashboard backend
- [Axios](https://axios-http.com/) — YouTube API requests
- Discord OAuth2 — dashboard authentication

---

## Setup

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/op-core.git
cd op-core
npm install
```

### 2. Configure environment variables
Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `DISCORD_TOKEN` | Your bot token from Discord Dev Portal |
| `CLIENT_ID` | Your bot's application ID |
| `ABDULLAH` | Your Discord user ID (owner) |
| `YOUTUBE_API_KEY` | Google Cloud YouTube Data API v3 key |
| `CZPK` | Guild ID of your first server |
| `The Eagnibals` | Guild ID of your second server |
| `DISCORD_CLIENT_SECRET` | OAuth2 client secret for the dashboard |
| `DASHBOARD_REDIRECT_URI` | e.g. `http://localhost:4000/auth/callback` |
| `SESSION_SECRET` | Any long random string |

### 3. Run
```bash
node index.js
```

---

## Dashboard

The web dashboard runs on port `4000` by default.

To use it:
1. Go to [Discord Dev Portal](https://discord.com/developers) → Your App → OAuth2 → Redirects
2. Add your redirect URI (e.g. `https://yourdomain.com/auth/callback`)
3. Visit `http://localhost:4000` and sign in with Discord

Only the owner (configured via `ABDULLAH` env var) can access the dashboard.

---

## Deployment

This bot is designed to run on [Railway](https://railway.app).

1. Push to a **private** GitHub repo
2. Connect the repo on Railway
3. Add all environment variables in Railway's Variables tab
4. Railway auto-deploys on every push

> ⚠️ Never commit your `.env` file. It's already in `.gitignore`.

---

## Project Structure

```
op-core/
├── index.js                     # Launcher — starts all processes
├── src/
│   ├── bot.js                   # Main Discord client
│   ├── commands/
│   │   ├── registry.js          # All slash command definitions
│   │   ├── handler.js           # Routes interactions
│   │   ├── general.js           # ping, help, links, server, banlist
│   │   ├── info.js              # info, av, banner
│   │   ├── moderation.js        # kick, ban, unban, tmt, ctmt, clear
│   │   └── admin.js             # role, setstatus, setup
│   ├── events/
│   │   ├── guildMemberAdd.js    # Welcome messages + role assign
│   │   └── guildMemberRemove.js # Goodbye messages
│   └── services/
│       ├── config.js            # Read/write servers.json
│       └── youtubeNotifier.js   # YouTube upload polling
├── dashboard/
│   ├── server.js                # Express server + Discord OAuth
│   └── public/
│       ├── index.html           # Dashboard UI
│       └── login.html           # Login page
└── data/
    └── servers.json             # Per-guild configuration
```

---

## License

MIT — do whatever you want with it.

---

*Developed by Abdullah*
