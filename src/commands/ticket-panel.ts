import type { ChatInputCommandInteraction } from 'discord.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { ticketPanelEmbed } from '../utils/embeds.js';
import { requireTicketPermission } from '../utils/permissions.js';
import { COMPONENT_IDS } from '../utils/constants.js';
import { checkRateLimit } from '../services/rateLimit.js';
import { errorEmbed } from '../utils/embeds.js';

export const name = 'ticket-panel';
export const description = 'Post the ticket panel in this channel (staff only)';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const { allowed } = await checkRateLimit({
    kind: 'slash',
    commandName: name,
    userId: interaction.user.id,
  });
  if (!allowed) {
    await interaction.reply({ content: 'Rate limited. Try again in a minute.', ephemeral: true }).catch(() => {});
    return;
  }

  if (!interaction.guild || !interaction.channel?.isSendable()) return;

  try {
    await requireTicketPermission(interaction.member as import('discord.js').GuildMember);
  } catch {
    await interaction.reply({
      ephemeral: true,
      embeds: [errorEmbed('Permission denied', 'You need staff permissions to post the ticket panel.')],
    }).catch(() => {});
    return;
  }

  const button = new ButtonBuilder()
    .setCustomId(COMPONENT_IDS.TICKET_OPEN)
    .setLabel('Open a ticket')
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);
  const embed = ticketPanelEmbed();

  await interaction.channel.send({ embeds: [embed], components: [row] }).catch(() => {});
  await interaction.reply({ ephemeral: true, content: 'Ticket panel posted.' }).catch(() => {});
}
