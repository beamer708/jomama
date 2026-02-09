-- Unity Vault Bot - PostgreSQL schema (run once: psql $DATABASE_URL -f schema.sql)
-- Compatible with existing Prisma schema; safe to run if tables exist (uses IF NOT EXISTS where possible).

DO $$ BEGIN
  CREATE TYPE ticket_type AS ENUM ('support', 'report', 'partnership', 'suggestion');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE ticket_status AS ENUM ('Open', 'Reopened', 'Escalated', 'Closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS guild_config (
    id TEXT PRIMARY KEY,
    log_channel_id TEXT,
    ticket_category_id TEXT,
    support_role_ids TEXT NOT NULL DEFAULT '',
    onboarding_channel_id TEXT,
    ticket_counter INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL REFERENCES guild_config(id) ON DELETE CASCADE,
    channel_id TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL,
    type ticket_type NOT NULL,
    status ticket_status NOT NULL DEFAULT 'Open',
    subject TEXT,
    description TEXT,
    escalated_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    closed_by TEXT,
    transcript_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ticket_guild_status ON ticket(guild_id, status);
CREATE INDEX IF NOT EXISTS idx_ticket_user ON ticket(user_id);

CREATE TABLE IF NOT EXISTS interaction_state (
    id TEXT PRIMARY KEY,
    custom_id TEXT NOT NULL,
    payload TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_interaction_state_custom_id ON interaction_state(custom_id);
CREATE INDEX IF NOT EXISTS idx_interaction_state_expires ON interaction_state(expires_at);

CREATE TABLE IF NOT EXISTS rate_limit_entry (
    key TEXT PRIMARY KEY,
    count INT NOT NULL DEFAULT 1,
    window_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rate_limit_window ON rate_limit_entry(window_end);

-- Prisma uses camelCase in DB with @@map; default Prisma schema does not map, so column names are camelCase.
-- Discord bot (Prisma) uses: guildId, channelId, etc. PostgreSQL default is lowercase.
-- We use snake_case in schema.sql for Python; Python code will use snake_case column names.
