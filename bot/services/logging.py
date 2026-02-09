"""Send mod and ticket logs to configured channel."""
import discord
from bot.database import queries as db
from bot.utils.embeds import base_embed


async def send_log(
    guild: discord.Guild,
    event_type: str,
    *,
    channel_id: str | None = None,
    user: discord.User | None = None,
    ticket_type: str | None = None,
    ticket_number: int | None = None,
    closed_by: discord.User | None = None,
    reopened_by: discord.User | None = None,
    escalated_by: discord.User | None = None,
) -> None:
    config = await db.guild_get_or_create(str(guild.id))
    log_channel_id = config.get("log_channel_id") or None
    if not log_channel_id:
        return
    channel = guild.get_channel(int(log_channel_id))
    if not channel or not isinstance(channel, discord.TextChannel):
        return
    embed = base_embed(timestamp=True)
    if event_type == "ticket_created" and channel_id and user and ticket_type is not None and ticket_number is not None:
        embed.title = "Ticket Created"
        embed.color = 0x57F287
        embed.add_field(name="Channel", value=f"<#{channel_id}>", inline=True)
        embed.add_field(name="User", value=f"{user.tag} ({user.id})", inline=True)
        embed.add_field(name="Type", value=ticket_type, inline=True)
        embed.add_field(name="Ticket #", value=str(ticket_number), inline=False)
    elif event_type == "ticket_closed" and channel_id and closed_by:
        embed.title = "Ticket Closed"
        embed.color = 0xFEE75C
        embed.add_field(name="Channel", value=f"<#{channel_id}>", inline=True)
        embed.add_field(name="Closed by", value=closed_by.tag, inline=True)
        embed.add_field(name="Ticket #", value=str(ticket_number or "—"), inline=True)
    elif event_type == "ticket_reopened" and channel_id and reopened_by:
        embed.title = "Ticket Reopened"
        embed.color = 0x57F287
        embed.add_field(name="Channel", value=f"<#{channel_id}>", inline=True)
        embed.add_field(name="Reopened by", value=reopened_by.tag, inline=True)
    elif event_type == "ticket_escalated" and channel_id and escalated_by:
        embed.title = "Ticket Escalated"
        embed.color = 0xEB459E
        embed.add_field(name="Channel", value=f"<#{channel_id}>", inline=True)
        embed.add_field(name="Escalated by", value=escalated_by.tag, inline=True)
    else:
        return
    await channel.send(embed=embed)
