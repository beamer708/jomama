"""
Unity Vault Bot - Entry point.
Run with Python 3.12+: python main.py
"""
import asyncio
import os
import sys

import discord
from discord import app_commands

from bot.config import DISCORD_TOKEN, GUILD_ID
from bot.database import close_pool, init_pool, queries as db
from bot.commands import setup_commands
from bot.views import TicketChannelView, TicketPanelView


class UnityVaultBot(discord.Client):
    def __init__(self) -> None:
        intents = discord.Intents.default()
        intents.guilds = True
        intents.members = True
        intents.message_content = False
        super().__init__(intents=intents)
        self.tree = app_commands.CommandTree(self)

    async def setup_hook(self) -> None:
        guild_id = int(GUILD_ID) if GUILD_ID else None
        setup_commands(self.tree, guild_id)
        self.add_view(TicketPanelView())
        self.add_view(TicketChannelView())

    async def on_ready(self) -> None:
        print(f"Logged in as {self.user} ({self.user.id})")
        activity = discord.Activity(type=discord.ActivityType.watching, name="Unity Vault", url="https://www.unityvault.space/")
        await self.change_presence(activity=activity)
        guild_id = int(GUILD_ID) if GUILD_ID else None
        if guild_id:
            self.tree.copy_global_to(guild=discord.Object(id=guild_id))
        await self.tree.sync(guild=discord.Object(id=guild_id) if guild_id else None)

    async def on_member_join(self, member: discord.Member) -> None:
        config = await db.guild_get_or_create(str(member.guild.id))
        channel_id = config.get("onboarding_channel_id")
        if not channel_id:
            return
        channel = member.guild.get_channel(int(channel_id))
        if not channel or not isinstance(channel, discord.TextChannel):
            return
        from bot.constants import BRAND
        from bot.utils.embeds import base_embed
        embed = base_embed(
            title=f"Welcome to {BRAND['name']}",
            description=f"Welcome, **{member}**! Check out the server and use `/help` for bot commands.",
            thumbnail=member.display_avatar.url,
            timestamp=True,
        )
        await channel.send(member.mention, embed=embed)


async def main() -> None:
    if not DISCORD_TOKEN:
        print("Missing DISCORD_TOKEN in environment.")
        sys.exit(1)
    await init_pool()
    async with UnityVaultBot() as client:
        await client.start(DISCORD_TOKEN)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
    finally:
        asyncio.run(close_pool())
