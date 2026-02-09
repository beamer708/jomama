"""Themed embeds for Unity Vault."""
import discord
from bot.constants import BRAND


def base_embed(
    *,
    title: str | None = None,
    description: str | None = None,
    url: str | None = None,
    thumbnail: str | None = None,
    fields: list[dict[str, str | bool]] | None = None,
    footer: str | None = None,
    timestamp: bool = False,
) -> discord.Embed:
    embed = discord.Embed(
        color=BRAND["color"],
        title=title,
        description=description,
        url=url,
        timestamp=discord.utils.utcnow() if timestamp else None,
    )
    embed.set_footer(text=footer or BRAND["footer_text"])
    if thumbnail:
        embed.set_thumbnail(url=thumbnail)
    if fields:
        for f in fields:
            embed.add_field(
                name=f["name"],
                value=f["value"],
                inline=f.get("inline", False),
            )
    return embed


def success_embed(title: str, description: str) -> discord.Embed:
    embed = base_embed(title=f"✅ {title}", description=description, timestamp=True)
    embed.color = 0x57F287
    return embed


def error_embed(title: str, description: str) -> discord.Embed:
    embed = base_embed(title=f"❌ {title}", description=description, timestamp=True)
    embed.color = 0xED4245
    return embed


def ticket_embed(
    ticket_type: str,
    subject: str | None,
    description: str | None,
    user_name: str,
    user_tag: str,
    ticket_number: int,
) -> discord.Embed:
    parts = []
    if subject:
        parts.append(f"**Subject:** {subject}")
    if description:
        parts.append(f"**Details:**\n{description}")
    desc = "\n\n".join(parts) if parts else "No additional details provided."
    return base_embed(
        title=f"Ticket · {ticket_type}",
        description=desc,
        fields=[
            {"name": "Opened by", "value": f"{user_name} (`{user_tag}`)", "inline": True},
            {"name": "Ticket #", "value": str(ticket_number), "inline": True},
        ],
        timestamp=True,
    )


def ticket_panel_embed() -> discord.Embed:
    return base_embed(
        title="Support & Feedback",
        description=(
            "**Unity Vault** uses a ticket system for support, reports, partnerships, and suggestions.\n\n"
            "Click **Open a ticket** below and choose a type. You may be asked to fill a short form.\n\n"
            "• **Support** – General help and questions\n"
            "• **Report** – Report a user or issue\n"
            "• **Partnership** – Partnership or collaboration inquiries\n"
            "• **Suggestion** – Ideas and feedback for the server"
        ),
        timestamp=True,
    )
