# Unity Vault Bot

Production-grade Discord bot for the [Unity Vault](https://www.unityvault.space/) community. Provides ticket-based support, server automation, and a showcase-ready helper experience.

## Tech stack

- **Runtime:** Node.js 20+ (LTS)
- **Language:** TypeScript (strict)
- **Library:** discord.js v14
- **Database:** PostgreSQL with Prisma ORM
- **Config:** `.env` (no hardcoded secrets)

## Project structure

```
src/
├── commands/          # Slash commands only
│   ├── ping.ts
│   ├── help.ts
│   ├── status.ts
│   ├── ticket-panel.ts
│   ├── config.ts
│   └── index.ts
├── components/        # Buttons, select menus, modals + central router
│   ├── router.ts
│   └── handlers/
│       ├── ticketOpen.ts
│       ├── ticketSelectType.ts
│       ├── modalTicket.ts
│       ├── ticketClose.ts
│       ├── ticketCloseConfirm.ts
│       └── ticketEscalate.ts
├── events/
│   ├── ready.ts
│   ├── interactionCreate.ts
│   ├── guildMemberAdd.ts
│   └── index.ts
├── services/
│   ├── ticket.ts      # Create/close/escalate tickets
│   ├── logging.ts     # Mod and ticket logs
│   └── rateLimit.ts   # Per-user rate limiting
├── database/
│   ├── client.ts      # Prisma singleton
│   ├── queries.ts     # Guild, ticket, rate limit, interaction state
│   └── (Prisma schema in prisma/schema.prisma)
├── utils/
│   ├── constants.ts   # Brand, component IDs, rate limit config
│   ├── embeds.ts      # Themed embeds
│   ├── permissions.ts # Staff / ticket permission checks
│   └── validators.ts  # Modal and input validation
├── scripts/
│   └── deploy-commands.ts
└── index.ts           # Entry: client, event registration, shutdown
```

## Setup

1. **Clone and install**

   ```bash
   cd UnityVaultBot
   npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env` and set:

   - `DISCORD_TOKEN` – Bot token from [Discord Developer Portal](https://discord.com/developers/applications)
   - `DISCORD_CLIENT_ID` – Application ID (same app)
   - `DATABASE_URL` – PostgreSQL connection string, e.g.  
     `postgresql://user:password@localhost:5432/unityvault_bot`

   Optional (can also be set via `/config` or DB):

   - `GUILD_ID` – If set, slash commands deploy to this guild only (faster during development)
   - `LOG_CHANNEL_ID` – Default log channel for tickets and mod actions
   - `TICKET_CATEGORY_ID` – Category under which ticket channels are created
   - `SUPPORT_ROLE_IDS` – Comma-separated role IDs that can manage tickets (or set via `/config`)
   - `ONBOARDING_CHANNEL_ID` – Channel for welcome messages on member join

3. **Database**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

   For production migrations: `npx prisma migrate deploy`.

4. **Register slash commands**

   ```bash
   npm run deploy:commands
   ```

   Without `GUILD_ID`, commands register globally (can take up to an hour to propagate). With `GUILD_ID`, they register for that server only and appear immediately.

5. **Run**

   ```bash
   npm run dev    # Development with ts-node-dev
   npm run build && npm start   # Production
   ```

## Features

### Ticket system

- **Panel:** Staff run `/ticket-panel` in the desired channel; the panel shows an **Open a ticket** button.
- **Flow:** User clicks the button → selects type (Support, Report, Partnership, Suggestion) → modal with subject and description → ticket channel is created.
- **In-ticket:** Close (with confirmation) and Escalate buttons; only the opener or staff can close; only staff can escalate.
- **Logging:** Ticket created/closed/reopened/escalated events are sent to the configured log channel.
- **Limits:** Per-user rate limit on opening tickets; max open tickets per user (default 2).

### Commands

| Command         | Description                          | Who        |
|----------------|--------------------------------------|------------|
| `/ping`        | Bot latency and WebSocket ping       | Everyone   |
| `/help`        | Bot info and command list            | Everyone   |
| `/status`      | Health check (DB, WS, uptime)        | Everyone   |
| `/ticket-panel`| Post the ticket panel in this channel| Staff only |
| `/config`      | View or set log channel, ticket category, support roles, onboarding channel | Staff only |

### Components (custom IDs)

- `ticket:open` – Button to start ticket flow.
- `ticket:select:type` – Select menu for ticket type.
- `modal:ticket:support` / `report` / `partnership` / `suggestion` – Modal submit creates the ticket.
- `ticket:close` – Confirmation step; `ticket:close:confirm` – Close and delete channel.
- `ticket:escalate` – Mark ticket escalated (staff only).

All component handling is routed in `src/components/router.ts`; handlers live under `src/components/handlers/`.

### Security and reliability

- **Rate limiting:** Slash commands, ticket creation, and button interactions are rate-limited (see `src/utils/constants.ts`).
- **Permissions:** Ticket management and panel/config require staff (support roles or admin-level permissions).
- **Errors:** Interaction errors are caught and replied to with an embed; the process does not crash on handler errors.
- **State:** Ticket and config state live in PostgreSQL; no in-memory-only state for critical flows.

## Configuration

- **Branding:** Embed color and footer are in `src/utils/constants.ts` (BRAND).
- **Rate limits:** `src/utils/constants.ts` (RATE_LIMITS).
- **Max open tickets per user:** `src/components/handlers/ticketOpen.ts` (MAX_OPEN_TICKETS).

## License

Private / internal use for Unity Vault. Adjust as needed for your project.
