# Unity Vault Bot

Discord bot for Unity Vault. Node.js v24, TypeScript, discord.js v14, MongoDB (Mongoose).

## Setup

1. Node.js v24+
2. Copy `.env.example` to `.env`, set `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `DATABASE_URL`
3. `npm install`
4. `npm run build`
5. `npm start`

## Structure

```
src/
  commands/   # Slash commands (ping, help, status)
  events/     # ready, interactionCreate
  models/     # Mongoose models (e.g. Ticket)
  database/   # connect.ts
  index.ts
```

## Commands

- `/ping` — Latency
- `/help` — Command list
- `/status` — Bot and database status
