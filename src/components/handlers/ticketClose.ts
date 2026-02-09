import type { ButtonInteraction } from 'discord.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { isStaff } from '../../utils/permissions.js';
import { ticketQueries } from '../../database/queries.js';
import { errorEmbed } from '../../utils/embeds.js';
import { COMPONENT_IDS } from '../../utils/constants.js';

export async function handleTicketClose(interaction: ButtonInteraction): Promise<void> {
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

  const confirm = new ButtonBuilder()
    .setCustomId(COMPONENT_IDS.TICKET_CLOSE_CONFIRM)
    .setLabel('Yes, close ticket')
    .setStyle(ButtonStyle.Danger);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirm);
  await interaction.reply({
    ephemeral: true,
    content: 'Are you sure you want to close this ticket?',
    components: [row],
  }).catch(() => {});
}
