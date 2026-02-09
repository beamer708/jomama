"""Rate limiting using database."""
from bot.constants import RATE_LIMITS
from bot.database import queries as db


def _key_slash(command_name: str, user_id: str) -> str:
    return f"slash:{command_name}:{user_id}"


def _key_ticket_create(guild_id: str, user_id: str) -> str:
    return f"ticket:create:{guild_id}:{user_id}"


def _key_button(custom_id: str, user_id: str) -> str:
    return f"btn:{custom_id}:{user_id}"


async def check_slash(command_name: str, user_id: str) -> tuple[bool, int | None]:
    limit, window = RATE_LIMITS["slash"]
    allowed, remaining = await db.rate_limit_check(_key_slash(command_name, user_id), limit, window)
    return allowed, window if not allowed else None


async def check_ticket_create(guild_id: str, user_id: str) -> tuple[bool, int | None]:
    limit, window = RATE_LIMITS["ticket_create"]
    allowed, _ = await db.rate_limit_check(_key_ticket_create(guild_id, user_id), limit, window)
    return allowed, window if not allowed else None


async def check_button(custom_id: str, user_id: str) -> tuple[bool, int | None]:
    limit, window = RATE_LIMITS["button"]
    allowed, _ = await db.rate_limit_check(_key_button(custom_id, user_id), limit, window)
    return allowed, window if not allowed else None
