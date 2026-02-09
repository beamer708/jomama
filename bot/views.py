"""Persistent and ephemeral views for ticket buttons, select, modals."""
from __future__ import annotations

import discord
from bot.constants import (
    MAX_DESCRIPTION_LENGTH,
    MAX_SUBJECT_LENGTH,
    MIN_DESCRIPTION_LENGTH,
    TICKET_CLOSE,
    TICKET_CLOSE_CONFIRM,
    TICKET_ESCALATE,
    TICKET_OPEN,
    TICKET_SELECT_TYPE,
    TICKET_TYPES,
)
from bot.database import queries as db
from bot.services import rate_limit, ticket as ticket_svc
from bot.services.logging import send_log
from bot.utils.embeds import error_embed, success_embed
from bot.utils.permissions import is_staff
from bot.utils.validators import validate_description, validate_subject


class TicketPanelView(discord.ui.View):
    """Single button: Open a ticket. Persistent so panel works after restart."""

    def __init__(self) -> None:
        super().__init__(timeout=None)

    @discord.ui.button(label="Open a ticket", style=discord.ButtonStyle.primary, custom_id=TICKET_OPEN)
    async def open_ticket(self, interaction: discord.Interaction, _: discord.ui.Button) -> None:
        if not interaction.guild or not interaction.user:
            return
        allowed, retry_after = await rate_limit.check_ticket_create(str(interaction.guild.id), str(interaction.user.id))
        if not allowed:
            await interaction.response.send_message(
                embed=error_embed("Rate limited", f"Please wait {retry_after or 60} seconds before opening another ticket."),
                ephemeral=True,
            )
            return
        open_count = await db.ticket_count_open_by_user(str(interaction.guild.id), str(interaction.user.id))
        if open_count >= 2:
            await interaction.response.send_message(
                embed=error_embed("Too many open tickets", f"You have {open_count} open ticket(s). Please wait for them to be closed."),
                ephemeral=True,
            )
            return
        view = TicketTypeSelectView()
        await interaction.response.send_message(
            "Select a ticket type below:",
            view=view,
            ephemeral=True,
        )


class TicketTypeSelectView(discord.ui.View):
    """Select menu for ticket type; on select, show modal."""

    def __init__(self) -> None:
        super().__init__(timeout=60)

    @discord.ui.select(
        placeholder="Choose ticket type…",
        custom_id=TICKET_SELECT_TYPE,
        options=[
            discord.SelectOption(label="Support", description="General help and questions", value="support"),
            discord.SelectOption(label="Report", description="Report a user or issue", value="report"),
            discord.SelectOption(label="Partnership", description="Partnership or collaboration", value="partnership"),
            discord.SelectOption(label="Suggestion", description="Ideas and feedback", value="suggestion"),
        ],
    )
    async def select_type(self, interaction: discord.Interaction, select: discord.ui.Select) -> None:
        value = select.values[0] if select.values else None
        if value not in TICKET_TYPES:
            return
        modal = TicketModal(ticket_type=value)
        await interaction.response.send_modal(modal)


class TicketModal(discord.ui.Modal):
    """Modal for ticket subject + description."""

    def __init__(self, ticket_type: str) -> None:
        self.ticket_type = ticket_type
        title = f"Ticket: {ticket_type}"
        super().__init__(title=title)
        self.subject_input = discord.ui.TextInput(
            label="Subject" if ticket_type == "support" else "Subject (e.g. username or brief summary)" if ticket_type == "report" else "Organization / project name" if ticket_type == "partnership" else "Suggestion title",
            style=discord.TextStyle.short,
            max_length=MAX_SUBJECT_LENGTH,
            required=True,
        )
        self.desc_input = discord.ui.TextInput(
            label="Describe your issue or question" if ticket_type == "support" else "What happened? Include details and evidence if possible." if ticket_type == "report" else "Tell us about your project and what you're looking for" if ticket_type == "partnership" else "Describe your idea or feedback",
            style=discord.TextStyle.paragraph,
            min_length=MIN_DESCRIPTION_LENGTH,
            max_length=MAX_DESCRIPTION_LENGTH,
            required=True,
        )
        self.add_item(self.subject_input)
        self.add_item(self.desc_input)

    async def on_submit(self, interaction: discord.Interaction) -> None:
        if not interaction.guild or not interaction.user:
            return
        ok_subj, msg_subj, subj = validate_subject(self.subject_input.value)
        if not ok_subj:
            await interaction.response.send_message(embed=error_embed("Invalid input", msg_subj), ephemeral=True)
            return
        ok_desc, msg_desc, desc = validate_description(self.desc_input.value)
        if not ok_desc:
            await interaction.response.send_message(embed=error_embed("Invalid input", msg_desc), ephemeral=True)
            return
        await interaction.response.defer(ephemeral=True)
        try:
            channel, _ = await ticket_svc.create_ticket_channel(
                interaction.guild,
                interaction.user,
                self.ticket_type,
                subj,
                desc,
            )
            await interaction.followup.send(f"Your ticket has been created: {channel.mention}", ephemeral=True)
        except Exception as e:
            await interaction.followup.send(embed=error_embed("Could not create ticket", str(e)), ephemeral=True)


class TicketChannelView(discord.ui.View):
    """Close and Escalate buttons in ticket channel. Persistent."""

    def __init__(self) -> None:
        super().__init__(timeout=None)

    @discord.ui.button(label="Close ticket", style=discord.ButtonStyle.danger, custom_id=TICKET_CLOSE)
    async def close_ticket(self, interaction: discord.Interaction, _: discord.ui.Button) -> None:
        if not interaction.guild or not interaction.channel or interaction.channel.is_private:
            return
        ticket = await db.ticket_find_by_channel(str(interaction.channel.id))
        if not ticket:
            await interaction.response.send_message(embed=error_embed("Error", "This channel is not a ticket."), ephemeral=True)
            return
        is_author = str(ticket["user_id"]) == str(interaction.user.id)
        staff = await is_staff(interaction.user) if isinstance(interaction.user, discord.Member) else False
        if not is_author and not staff:
            await interaction.response.send_message(
                embed=error_embed("Permission denied", "Only the ticket opener or staff can close this ticket."),
                ephemeral=True,
            )
            return
        view = ConfirmCloseView()
        await interaction.response.send_message("Are you sure you want to close this ticket?", view=view, ephemeral=True)

    @discord.ui.button(label="Escalate", style=discord.ButtonStyle.primary, custom_id=TICKET_ESCALATE)
    async def escalate_ticket(self, interaction: discord.Interaction, _: discord.ui.Button) -> None:
        if not interaction.guild or not interaction.channel or interaction.channel.is_private:
            return
        if not isinstance(interaction.user, discord.Member):
            return
        if not await is_staff(interaction.user):
            await interaction.response.send_message(
                embed=error_embed("Permission denied", "Only staff can escalate this ticket."),
                ephemeral=True,
            )
            return
        ticket = await db.ticket_find_by_channel(str(interaction.channel.id))
        if not ticket:
            await interaction.response.send_message(embed=error_embed("Error", "This channel is not a ticket."), ephemeral=True)
            return
        from datetime import datetime, timezone
        await db.ticket_update(ticket["id"], status="Escalated", escalated_at=datetime.now(timezone.utc))
        await send_log(
            interaction.guild,
            "ticket_escalated",
            channel_id=str(interaction.channel.id),
            escalated_by=interaction.user,
        )
        await interaction.response.send_message(
            embed=success_embed("Ticket escalated", "This ticket has been marked as escalated for senior staff."),
            ephemeral=True,
        )


class ConfirmCloseView(discord.ui.View):
    """Ephemeral confirm close button."""

    def __init__(self) -> None:
        super().__init__(timeout=30)

    @discord.ui.button(label="Yes, close ticket", style=discord.ButtonStyle.danger, custom_id=TICKET_CLOSE_CONFIRM)
    async def confirm(self, interaction: discord.Interaction, _: discord.ui.Button) -> None:
        if not interaction.guild or not interaction.channel or interaction.channel.is_private:
            return
        ticket = await db.ticket_find_by_channel(str(interaction.channel.id))
        if not ticket:
            await interaction.response.send_message(embed=error_embed("Error", "This channel is not a ticket."), ephemeral=True)
            return
        is_author = str(ticket["user_id"]) == str(interaction.user.id)
        staff = await is_staff(interaction.user) if isinstance(interaction.user, discord.Member) else False
        if not is_author and not staff:
            await interaction.response.send_message(
                embed=error_embed("Permission denied", "Only the ticket opener or staff can close this ticket."),
                ephemeral=True,
            )
            return
        await interaction.response.defer(ephemeral=True)
        ch = interaction.channel
        await ticket_svc.close_ticket_channel(interaction.guild, ch, interaction.user)
        await interaction.followup.send("Ticket closed.", ephemeral=True)
