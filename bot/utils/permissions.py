"""Staff and ticket permission checks."""
import discord
from bot.database import queries as db

ADMIN_PERMISSIONS = discord.Permissions(
    manage_channels=True,
    manage_roles=True,
    moderate_members=True,
    view_channel=True,
    send_messages=True,
    manage_messages=True,
)


async def can_manage_tickets(member: discord.Member) -> bool:
    if member.guild_permissions >= ADMIN_PERMISSIONS:
        return True
    config = await db.guild_get_or_create(str(member.guild.id))
    role_ids = db.get_support_role_ids(config)
    return any(str(r.id) in role_ids for r in member.roles)


async def is_staff(member: discord.Member) -> bool:
    return await can_manage_tickets(member)


async def require_ticket_permission(member: discord.Member) -> None:
    if not await can_manage_tickets(member):
        raise PermissionError("You do not have permission to manage tickets in this server.")
