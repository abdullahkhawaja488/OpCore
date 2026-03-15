# OpCore 🤖

A powerful, multi-server Discord bot — featuring moderation, warnings, ticket system, and a private web dashboard.

---

## Features

**Moderation**
- `/kick`, `/ban`, `/unban` — with automatic DMs and rejoin invites
- `/tmt`, `/ctmt` — timeout and cancel timeout
- `/clear` — bulk delete up to 100 messages
- `/warn`, `/warnings`, `/clearwarn` — warning system with DMs and audit trail
- All moderation actions are automatically logged to a configured log channel

**Ticket System**
- `/ticket open` — creates a private support channel for the user
- `/ticket close` — deletes the ticket channel after 5 seconds
- `/ticket add` — adds another user to the ticket

**Server Management**
- `/setup` — configure welcome, goodbye, rules, member count, and mod log channels per server
- `/role` — give or take roles from users
- `/setstatus` — change the bot's activity status

**Info Commands**
- `/info` — user profile, join dates, boost status
- `/av` — fetch any user's avatar
- `/banner` — fetch any user's banner
- `/server` — server stats including latency, roles, channels
- `/banlist` — view all banned users

**Web Dashboard** *(Owner only)*
- Login with Discord OAuth2
- View and edit per-server configurations
- Audit log — every moderation action logged with moderator, target, and reason
- Warnings viewer across all servers
- Live log stream
- Bot status control

---

## Tech Stack

- [Discord.js](https://discord.js.org/) v14
- [Node.js](https://nodejs.org/) v20+
- [Express](https://expressjs.com/) — dashboard backend
- [Axios](https://axios-http.com/) — Upstash requests
- [Upstash Redis](https://upstash.com/) — persistent config & warning storage
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
| `OWNER_ID` | Your Discord user ID (owner) |
| `DISCORD_CLIENT_SECRET` | OAuth2 client secret for the dashboard |
| `DASHBOARD_REDIRECT_URI` | e.g. `http://localhost:4000/auth/callback` |
| `SESSION_SECRET` | Any long random string |
| `DASHBOARD_PORT` | 4000 |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token |

### 3. Run
```bash
node index.js
```

---

## Mod Log Channel

Run `/setup` and pass your desired log channel to the **log** option. Every moderation action (kick, ban, unban, timeout, clear, warn, etc.) will be posted as a rich embed in that channel, showing the moderator, target, and reason.

---

## Dashboard

The web dashboard runs on port `4000` by default.

To use it:
1. Go to [Discord Dev Portal](https://discord.com/developers) → Your App → OAuth2 → Redirects
2. Add your redirect URI (e.g. `https://yourdomain.com/auth/callback`)
3. Visit `http://localhost:4000` and sign in with Discord

Only the owner (configured via `OWNER_ID` env var) can access the dashboard.

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
│       ├── config.js            # Read/write config via Upstash Redis
│       ├── audit.js             # Logs every moderation action
│       ├── logger.js            # Posts mod actions to Discord log channel
│       └── warnings.js          # Warning storage
├── dashboard/
│   ├── server.js                # Express server + Discord OAuth
│   └── public/
│       ├── index.html           # Dashboard UI
│       └── login.html           # Login page
└── data/
    └── dashboard.log            # Dashboard log file
```

---

## License

MIT — do whatever you want with it.

---

*Developed by Abdullah*
