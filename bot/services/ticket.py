"""Ticket channel create/close/escalate."""
from datetime import datetime, timezone

import discord

from bot.config import TICKET_CATEGORY_ID
from bot.database import queries as db
from bot.services.logging import send_log
from bot.utils.embeds import ticket_embed
from bot.views import TicketChannelView


async def create_ticket_channel(
    guild: discord.Guild,
    user: discord.User,
    ticket_type: str,
    subject: str | None,
    description: str | None,
) -> tuple[discord.TextChannel, int]:
    config = await db.guild_get_or_create(str(guild.id))
    category_id = config.get("ticket_category_id") or TICKET_CATEGORY_ID
    try:
        category_id = int(category_id) if category_id else None
    except (TypeError, ValueError):
        category_id = None
    role_ids = db.get_support_role_ids(config)
    ticket_number = await db.guild_increment_ticket_counter(str(guild.id))

    overwrites = {
        guild.default_role: discord.PermissionOverwrite(view_channel=False),
        user: discord.PermissionOverwrite(
            view_channel=True,
            send_messages=True,
            read_message_history=True,
            attach_files=True,
            embed_links=True,
        ),
    }
    for rid in role_ids:
        try:
            role = guild.get_role(int(rid))
            if role:
                overwrites[role] = discord.PermissionOverwrite(
                    view_channel=True,
                    send_messages=True,
                    read_message_history=True,
                    attach_files=True,
                    embed_links=True,
                )
        except (ValueError, TypeError):
            continue

    channel = await guild.create_text_channel(
        name=f"ticket-{str(ticket_number).zfill(4)}",
        category=discord.Object(id=category_id) if category_id else None,
        overwrites=overwrites,
        topic=f"Ticket #{ticket_number} · {ticket_type} · {user}",
    )

    await db.ticket_create(
        str(guild.id),
        str(channel.id),
        str(user.id),
        ticket_type,
        subject=subject,
        description=description,
    )

    member = guild.get_member(user.id)
    display_name = member.display_name if member else user.name

    embed = ticket_embed(
        ticket_type,
        subject,
        description,
        display_name,
        str(user),
        ticket_number,
    )
    await channel.send(
        content=f"{user.mention}, your ticket has been created. Staff will assist you shortly.",
        embed=embed,
        view=TicketChannelView(),
    )

    await send_log(
        guild,
        "ticket_created",
        channel_id=str(channel.id),
        user=user,
        ticket_type=ticket_type,
        ticket_number=ticket_number,
    )
    return channel, ticket_number


async def close_ticket_channel(
    guild: discord.Guild,
    channel: discord.abc.GuildChannel,
    closed_by: discord.User,
) -> None:
    ticket = await db.ticket_find_by_channel(str(channel.id))
    if ticket:
        await db.ticket_update(
            ticket["id"],
            status="Closed",
            closed_at=datetime.now(timezone.utc),
            closed_by=str(closed_by.id),
        )
        config = await db.guild_get_or_create(str(guild.id))
        await send_log(
            guild,
            "ticket_closed",
            channel_id=str(channel.id),
            closed_by=closed_by,
            ticket_number=config.get("ticket_counter"),
        )
    await channel.delete(reason="Ticket closed")
