# OpCore 🤖

A powerful, multi-server Discord bot — featuring moderation, warnings, ticket system, YouTube notifications, and a private web dashboard.

---

## Features

**Moderation**
- `/kick`, `/ban`, `/unban` — with automatic DMs and rejoin invites
- `/tmt`, `/ctmt` — timeout and cancel timeout
- `/clear` — bulk delete up to 100 messages
- `/warn`, `/warnings`, `/clearwarn` — warning system with DMs and audit trail

**Ticket System**
- `/ticket open` — creates a private support channel for the user
- `/ticket close` — deletes the ticket channel after 5 seconds
- `/ticket add` — adds another user to the ticket

**Server Management**
- `/setup` — configure welcome, goodbye, rules, member count, and YouTube notify channels per server
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
- Persists seen video IDs via Upstash Redis — survives restarts and redeploys

**Web Dashboard** *(Owner only)*
- Login with Discord OAuth2
- View and edit per-server configurations
- Audit log — every moderation action logged with moderator, target, and reason
- Warnings viewer across all servers
- Live log stream
- Bot status control
- Manually trigger a YouTube check

---

## Tech Stack

- [Discord.js](https://discord.js.org/) v14
- [Node.js](https://nodejs.org/) v20+
- [Express](https://expressjs.com/) — dashboard backend
- [Axios](https://axios-http.com/) — YouTube API & Upstash requests
- [Upstash Redis](https://upstash.com/) — persistent storage for seen videos
- Discord OAuth2 — dashboard authentication

---

## Setup

### 1. Clone the repo
```bash
git clone https://github.com/abdullahkhawaja488/OpCore.git
cd OpCore
npm install
```

### 2. Configure environment variables
Copy `.env.example` to `.env` and fill in your values:

| Variable | Description |
|---|---|
| `DISCORD_TOKEN` | Your bot token from Discord Dev Portal |
| `CLIENT_ID` | Your bot's application ID |
| `ABDULLAH` | Your Discord user ID (owner) |
| `YOUTUBE_API_KEY` | Google Cloud YouTube Data API v3 key |
| `DISCORD_CLIENT_SECRET` | OAuth2 client secret for the dashboard |
| `DASHBOARD_REDIRECT_URI` | e.g. `http://localhost:4000/auth/callback` |
| `SESSION_SECRET` | Any long random string |
| `PORT` | 4000 |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL for storing seen YouTube videos |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token |

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
OpCore/
├── index.js                     # Launcher — starts all processes
├── src/
│   ├── bot.js                   # Main Discord client
│   ├── commands/
│   │   ├── registry.js          # All slash command definitions
│   │   ├── handler.js           # Routes interactions
│   │   ├── general.js           # ping, help, server, banlist
│   │   ├── info.js              # info, av, banner
│   │   ├── moderation.js        # kick, ban, unban, tmt, ctmt, clear
│   │   ├── admin.js             # role, setstatus, setup
│   │   ├── warnings.js          # warn, warnings, clearwarn
│   │   └── tickets.js           # ticket open/close/add
│   ├── events/
│   │   ├── guildMemberAdd.js    # Welcome messages + role assign
│   │   └── guildMemberRemove.js # Goodbye messages
│   └── services/
│       ├── config.js            # Read/write servers.json
│       ├── audit.js             # Logs every moderation action
│       ├── warnings.js          # Warning storage
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
