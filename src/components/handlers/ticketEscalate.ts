import type { ButtonInteraction } from 'discord.js';
import { isStaff } from '../../utils/permissions.js';
import { ticketQueries } from '../../database/queries.js';
import { escalateTicket } from '../../services/ticket.js';
import { sendLog } from '../../services/logging.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';

export async function handleTicketEscalate(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.guild || !interaction.channel || interaction.channel.isDMBased()) return;

  const staff = await isStaff(interaction.member as import('discord.js').GuildMember);
  if (!staff) {
    await interaction.reply({ ephemeral: true, embeds: [errorEmbed('Permission denied', 'Only staff can escalate this ticket.')] }).catch(() => {});
    return;
  }

  const ticket = await ticketQueries.findByChannel(interaction.channel.id);
  if (!ticket) {
    await interaction.reply({ ephemeral: true, embeds: [errorEmbed('Error', 'This channel is not a ticket.')] }).catch(() => {});
    return;
  }

  await escalateTicket(ticket.id, interaction.user);
  await sendLog(interaction.guild, {
    type: 'ticket_escalated',
    guild: interaction.guild,
    channelId: interaction.channel.id,
    escalatedBy: interaction.user,
  });

  await interaction.reply({
    ephemeral: true,
    embeds: [successEmbed('Ticket escalated', 'This ticket has been marked as escalated for senior staff.')],
  }).catch(() => {});
}
