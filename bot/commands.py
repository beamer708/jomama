"""Slash commands."""
from __future__ import annotations

import discord
from discord import app_commands

from bot.constants import BRAND
from bot.database import get_pool, queries as db
from bot.services import rate_limit
from bot.utils.embeds import base_embed, error_embed, ticket_panel_embed
from bot.utils.permissions import require_ticket_permission
from bot.views import TicketPanelView


def setup_commands(tree: app_commands.CommandTree, guild_id: int | None) -> None:
    """Register slash commands. If guild_id is set, sync to that guild only."""

    @tree.command(name="ping", description="Check bot latency and status")
    async def ping(interaction: discord.Interaction) -> None:
        allowed, _ = await rate_limit.check_slash("ping", str(interaction.user.id))
        if not allowed:
            await interaction.response.send_message("Rate limited. Try again in a minute.", ephemeral=True)
            return
        await interaction.response.defer()
        latency = round(interaction.client.latency * 1000) if interaction.client.latency else 0
        embed = base_embed(
            title="Pong",
            description=f"**WebSocket:** {latency} ms",
            timestamp=True,
        )
        await interaction.followup.send(embed=embed)

    @tree.command(name="help", description="Show bot commands and info")
    async def help_cmd(interaction: discord.Interaction) -> None:
        allowed, _ = await rate_limit.check_slash("help", str(interaction.user.id))
        if not allowed:
            await interaction.response.send_message("Rate limited. Try again in a minute.", ephemeral=True)
            return
        embed = base_embed(
            title=f"{BRAND['name']} Bot",
            description=f"Welcome to the **{BRAND['name']}** Discord helper bot.",
            url=BRAND["url"],
            fields=[
                {
                    "name": "Commands",
                    "value": "`/ping` – Latency and status\n`/help` – This message\n`/ticket-panel` – Post ticket panel (staff)\n`/config` – View or set server config (staff)\n`/status` – Health check",
                    "inline": False,
                },
                {
                    "name": "Tickets",
                    "value": "Use the **Open a ticket** button in the support channel to open a ticket. Choose a type (Support, Report, Partnership, Suggestion) and fill the form.",
                    "inline": False,
                },
            ],
            timestamp=True,
        )
        await interaction.response.send_message(embed=embed, ephemeral=True)

    @tree.command(name="status", description="Bot health and database status")
    async def status(interaction: discord.Interaction) -> None:
        allowed, _ = await rate_limit.check_slash("status", str(interaction.user.id))
        if not allowed:
            await interaction.response.send_message("Rate limited. Try again in a minute.", ephemeral=True)
            return
        try:
            pool = get_pool()
            await pool.fetchval("SELECT 1")
            db_status = "Connected"
        except Exception:
            db_status = "Disconnected"
        latency = round(interaction.client.latency * 1000) if interaction.client.latency else 0
        uptime = getattr(interaction.client, "uptime", None) or 0
        embed = base_embed(
            title="Status",
            description="Unity Vault Bot health check.",
            fields=[
                {"name": "Database", "value": db_status, "inline": True},
                {"name": "WebSocket", "value": f"{latency} ms", "inline": True},
                {"name": "Uptime", "value": _format_uptime(uptime), "inline": True},
            ],
            timestamp=True,
        )
        await interaction.response.send_message(embed=embed, ephemeral=True)

    @tree.command(name="ticket-panel", description="Post the ticket panel in this channel (staff only)")
    @app_commands.describe()
    async def ticket_panel(interaction: discord.Interaction) -> None:
        allowed, _ = await rate_limit.check_slash("ticket-panel", str(interaction.user.id))
        if not allowed:
            await interaction.response.send_message("Rate limited. Try again in a minute.", ephemeral=True)
            return
        if not interaction.guild or not interaction.channel:
            return
        if not isinstance(interaction.user, discord.Member):
            return
        try:
            await require_ticket_permission(interaction.user)
        except PermissionError:
            await interaction.response.send_message(
                embed=error_embed("Permission denied", "You need staff permissions to post the ticket panel."),
                ephemeral=True,
            )
            return
        embed = ticket_panel_embed()
        view = TicketPanelView()
        await interaction.channel.send(embed=embed, view=view)
        await interaction.response.send_message("Ticket panel posted.", ephemeral=True)

    @tree.command(name="config", description="View or set bot config for this server (staff only)")
    async def config(interaction: discord.Interaction) -> None:
        allowed, _ = await rate_limit.check_slash("config", str(interaction.user.id))
        if not allowed:
            await interaction.response.send_message("Rate limited. Try again in a minute.", ephemeral=True)
            return
        if not interaction.guild:
            return
        if not isinstance(interaction.user, discord.Member):
            return
        try:
            await require_ticket_permission(interaction.user)
        except PermissionError:
            await interaction.response.send_message(
                embed=error_embed("Permission denied", "You need staff permissions to use this command."),
                ephemeral=True,
            )
            return
        config = await db.guild_get_or_create(str(interaction.guild.id))
        embed = base_embed(
            title="Server config",
            fields=[
                {"name": "Log channel", "value": f"<#{config['log_channel_id']}>" if config.get("log_channel_id") else "Not set", "inline": True},
                {"name": "Ticket category", "value": config.get("ticket_category_id") or "Not set", "inline": True},
                {"name": "Support roles", "value": config.get("support_role_ids") or "Not set", "inline": False},
                {"name": "Onboarding channel", "value": f"<#{config['onboarding_channel_id']}>" if config.get("onboarding_channel_id") else "Not set", "inline": True},
                {"name": "Ticket counter", "value": str(config.get("ticket_counter", 0)), "inline": True},
            ],
            timestamp=True,
        )
        await interaction.response.send_message(embed=embed, ephemeral=True)


def _format_uptime(seconds: float) -> str:
    s = int(seconds)
    m, s = divmod(s, 60)
    h, m = divmod(m, 60)
    d, h = divmod(h, 24)
    if d:
        return f"{d}d {h}h"
    if h:
        return f"{h}h {m}m"
    if m:
        return f"{m}m {s}s"
    return f"{s}s"
