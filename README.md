# Unity Vault Bot

Production-grade Discord bot for the [Unity Vault](https://www.unityvault.space/) community. Provides ticket-based support, server automation, and a showcase-ready helper experience.

## Tech stack (Python)

- **Runtime:** Python 3.12.12+
- **Library:** discord.py 2.x (slash commands, modals, buttons, select menus)
- **Database:** PostgreSQL with asyncpg
- **Config:** `.env` via python-dotenv (no hardcoded secrets)

## Project structure

```
bot/
├── commands.py        # Slash commands (ping, help, status, ticket-panel, config)
├── views.py            # Ticket panel, type select, modals, close/escalate buttons
├── config.py           # Env loading
├── constants.py        # Brand, component IDs, rate limits
├── database/
│   ├── pool.py         # Async PG pool
│   └── queries.py      # Guild, ticket, rate limit queries
├── services/
│   ├── ticket.py       # Create/close/escalate ticket channels
│   ├── logging.py      # Mod and ticket logs
│   └── rate_limit.py   # Per-user rate limiting
└── utils/
    ├── embeds.py       # Themed embeds
    ├── permissions.py  # Staff / ticket permission checks
    └── validators.py   # Modal input validation
main.py                 # Entry: client, events, persistent views, tree sync
schema.sql              # PostgreSQL schema (run once)
```

## Setup

1. **Python 3.12.12**

   Use pyenv, asdf, or official installer. Check: `python --version`

2. **Install**

   ```bash
   cd UnityVaultBot
   pip install -r requirements.txt
   # or: pip install -e .
   ```

3. **Environment**

   Copy `.env.example` to `.env` and set:

   - `DISCORD_TOKEN` – Bot token from [Discord Developer Portal](https://discord.com/developers/applications)
   - `DISCORD_CLIENT_ID` – Application ID (same app)
   - `DATABASE_URL` – PostgreSQL connection string, e.g.  
     `postgresql://user:password@localhost:5432/unityvault_bot`

   Optional:

   - `GUILD_ID` – If set, slash commands sync to this guild only (faster during development)
   - `LOG_CHANNEL_ID` – Default log channel for tickets and mod actions
   - `TICKET_CATEGORY_ID` – Category under which ticket channels are created
   - `SUPPORT_ROLE_IDS` – Comma-separated role IDs that can manage tickets
   - `ONBOARDING_CHANNEL_ID` – Channel for welcome messages on member join

4. **Database**

   Create the schema (one-time):

   ```bash
   psql "$DATABASE_URL" -f schema.sql
   ```

   If you see "type ticket_type already exists", the schema is already applied.

5. **Run**

   ```bash
   python main.py
   ```

   Slash commands are synced on startup (global if `GUILD_ID` is unset, else to that guild).

## Features

### Ticket system

- **Panel:** Staff run `/ticket-panel` in the desired channel; the panel shows an **Open a ticket** button.
- **Flow:** User clicks the button → selects type (Support, Report, Partnership, Suggestion) → modal with subject and description → ticket channel is created.
- **In-ticket:** Close (with confirmation) and Escalate buttons; only the opener or staff can close; only staff can escalate.
- **Logging:** Ticket created/closed/escalated events are sent to the configured log channel.
- **Limits:** Per-user rate limit on opening tickets; max 2 open tickets per user.

### Commands

| Command          | Description                                | Who        |
|------------------|--------------------------------------------|------------|
| `/ping`          | Bot latency and WebSocket ping             | Everyone   |
| `/help`          | Bot info and command list                  | Everyone   |
| `/status`        | Health check (DB, WS, uptime)              | Everyone   |
| `/ticket-panel`  | Post the ticket panel in this channel      | Staff only |
| `/config`        | View server config (log channel, roles…)  | Staff only |

### Components (custom IDs)

- `ticket:open` – Button to start ticket flow.
- `ticket:select:type` – Select menu for ticket type.
- Modals for support/report/partnership/suggestion – Submit creates the ticket.
- `ticket:close` – Confirmation step; `ticket:close:confirm` – Close and delete channel.
- `ticket:escalate` – Mark ticket escalated (staff only).

Handling lives in `bot/views.py` (persistent views and modals).

### Security and reliability

- **Rate limiting:** Slash commands, ticket creation (DB-backed).
- **Permissions:** Ticket management and panel/config require staff (support roles or admin-level permissions).
- **State:** Ticket and config state in PostgreSQL.

## Configuration

- **Branding:** `bot/constants.py` (BRAND).
- **Rate limits:** `bot/constants.py` (RATE_LIMITS).
- **Max open tickets per user:** `bot/constants.py` (MAX_OPEN_TICKETS_PER_USER).

## License

Private / internal use for Unity Vault. Adjust as needed for your project.
