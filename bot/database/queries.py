"""Database queries for guild config, tickets, rate limits."""
import uuid
from datetime import datetime, timezone

import asyncpg

from bot.database.pool import get_pool

TicketType = str  # support | report | partnership | suggestion
TicketStatus = str  # Open | Reopened | Escalated | Closed


async def guild_get_or_create(guild_id: str) -> asyncpg.Record:
    pool = get_pool()
    row = await pool.fetchrow("SELECT * FROM guild_config WHERE id = $1", guild_id)
    if row:
        return row
    await pool.execute(
        "INSERT INTO guild_config (id) VALUES ($1) ON CONFLICT (id) DO NOTHING",
        guild_id,
    )
    return await pool.fetchrow("SELECT * FROM guild_config WHERE id = $1", guild_id)


async def guild_update(
    guild_id: str,
    *,
    log_channel_id: str | None = None,
    ticket_category_id: str | None = None,
    support_role_ids: str | None = None,
    onboarding_channel_id: str | None = None,
    ticket_counter: int | None = None,
) -> None:
    pool = get_pool()
    updates = []
    values = []
    i = 1
    if log_channel_id is not None:
        updates.append(f"log_channel_id = ${i}")
        values.append(log_channel_id)
        i += 1
    if ticket_category_id is not None:
        updates.append(f"ticket_category_id = ${i}")
        values.append(ticket_category_id)
        i += 1
    if support_role_ids is not None:
        updates.append(f"support_role_ids = ${i}")
        values.append(support_role_ids)
        i += 1
    if onboarding_channel_id is not None:
        updates.append(f"onboarding_channel_id = ${i}")
        values.append(onboarding_channel_id)
        i += 1
    if ticket_counter is not None:
        updates.append(f"ticket_counter = ${i}")
        values.append(ticket_counter)
        i += 1
    if not updates:
        return
    updates.append("updated_at = NOW()")
    values.append(guild_id)
    await pool.execute(
        f"UPDATE guild_config SET {', '.join(updates)} WHERE id = ${i}",
        *values,
    )


def get_support_role_ids(config: asyncpg.Record) -> list[str]:
    raw = config.get("support_role_ids") or ""
    return [r.strip() for r in raw.split(",") if r.strip()]


async def guild_increment_ticket_counter(guild_id: str) -> int:
    await guild_get_or_create(guild_id)
    pool = get_pool()
    row = await pool.fetchrow(
        "UPDATE guild_config SET ticket_counter = ticket_counter + 1, updated_at = NOW() WHERE id = $1 RETURNING ticket_counter",
        guild_id,
    )
    return row["ticket_counter"]


async def ticket_create(
    guild_id: str,
    channel_id: str,
    user_id: str,
    type: TicketType,
    subject: str | None = None,
    description: str | None = None,
) -> str:
    ticket_id = uuid.uuid4().hex
    pool = get_pool()
    await pool.execute(
        """INSERT INTO ticket (id, guild_id, channel_id, user_id, type, subject, description)
           VALUES ($1, $2, $3, $4, $5::ticket_type, $6, $7)""",
        ticket_id,
        guild_id,
        channel_id,
        user_id,
        type,
        subject,
        description,
    )
    return ticket_id


async def ticket_find_by_channel(channel_id: str) -> asyncpg.Record | None:
    pool = get_pool()
    return await pool.fetchrow("SELECT * FROM ticket WHERE channel_id = $1", channel_id)


async def ticket_update(
    ticket_id: str,
    *,
    status: TicketStatus | None = None,
    escalated_at: datetime | None = None,
    closed_at: datetime | None = None,
    closed_by: str | None = None,
    transcript_url: str | None = None,
) -> None:
    pool = get_pool()
    updates = ["updated_at = NOW()"]
    values = []
    i = 1
    if status is not None:
        updates.append(f"status = ${i}::ticket_status")
        values.append(status)
        i += 1
    if escalated_at is not None:
        updates.append(f"escalated_at = ${i}")
        values.append(escalated_at)
        i += 1
    if closed_at is not None:
        updates.append(f"closed_at = ${i}")
        values.append(closed_at)
        i += 1
    if closed_by is not None:
        updates.append(f"closed_by = ${i}")
        values.append(closed_by)
        i += 1
    if transcript_url is not None:
        updates.append(f"transcript_url = ${i}")
        values.append(transcript_url)
        i += 1
    values.append(ticket_id)
    await pool.execute(
        f"UPDATE ticket SET {', '.join(updates)} WHERE id = ${i}",
        *values,
    )


async def ticket_count_open_by_user(guild_id: str, user_id: str) -> int:
    pool = get_pool()
    row = await pool.fetchrow(
        """SELECT COUNT(*) AS c FROM ticket
           WHERE guild_id = $1 AND user_id = $2 AND status IN ('Open', 'Reopened', 'Escalated')""",
        guild_id,
        user_id,
    )
    return row["c"] or 0


async def rate_limit_check(key: str, limit: int, window_seconds: int) -> tuple[bool, int]:
    pool = get_pool()
    now = datetime.now(timezone.utc)
    window_end = datetime.fromtimestamp(now.timestamp() + window_seconds, tz=timezone.utc)
    row = await pool.fetchrow("SELECT count, window_end FROM rate_limit_entry WHERE key = $1", key)
    if not row:
        await pool.execute(
            """INSERT INTO rate_limit_entry (key, count, window_end)
               VALUES ($1, 1, $2) ON CONFLICT (key) DO UPDATE SET count = 1, window_end = $2""",
            key,
            window_end,
        )
        return True, limit - 1
    count, we = row["count"], row["window_end"]
    if we < now:
        await pool.execute(
            "UPDATE rate_limit_entry SET count = 1, window_end = $2 WHERE key = $1",
            key,
            window_end,
        )
        return True, limit - 1
    if count >= limit:
        return False, 0
    await pool.execute(
        "UPDATE rate_limit_entry SET count = count + 1 WHERE key = $1",
        key,
    )
    return True, limit - count - 1
