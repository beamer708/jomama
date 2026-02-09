import type { ButtonInteraction } from 'discord.js';
import { closeTicketChannel } from '../../services/ticket.js';
import { isStaff } from '../../utils/permissions.js';
import { ticketQueries } from '../../database/queries.js';
import { errorEmbed } from '../../utils/embeds.js';

export async function handleTicketCloseConfirm(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.guild || !interaction.channel || interaction.channel.isDMBased()) return;

  const ticket = await ticketQueries.findByChannel(interaction.channel.id);
  if (!ticket) {
    await interaction.reply({ ephemeral: true, embeds: [errorEmbed('Error', 'This channel is not a ticket.')] }).catch(() => {});
    return;
  }

  const isAuthor = ticket.userId === interaction.user.id;
  const staff = await isStaff(interaction.member as import('discord.js').GuildMember);
  if (!isAuthor && !staff) {
    await interaction.reply({ ephemeral: true, embeds: [errorEmbed('Permission denied', 'Only the ticket opener or staff can close this ticket.')] }).catch(() => {});
    return;
  }

  await interaction.deferUpdate().catch(() => {});
  const ch = interaction.channel as import('discord.js').GuildChannel;
  await closeTicketChannel(interaction.guild, ch, interaction.user);
}
