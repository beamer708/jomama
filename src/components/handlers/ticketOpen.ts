import type { ButtonInteraction } from 'discord.js';
import { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import { checkRateLimit } from '../../services/rateLimit.js';
import { ticketQueries } from '../../database/queries.js';
import { errorEmbed } from '../../utils/embeds.js';
import { COMPONENT_IDS } from '../../utils/constants.js';

const MAX_OPEN_TICKETS = 2;

export async function handleTicketOpen(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.guild || !interaction.member) return;

  const { allowed, retryAfterSeconds } = await checkRateLimit({
    kind: 'ticket_create',
    userId: interaction.user.id,
    guildId: interaction.guild.id,
  });
  if (!allowed) {
    await interaction.reply({
      ephemeral: true,
      embeds: [errorEmbed('Rate limited', `Please wait ${retryAfterSeconds ?? 60} seconds before opening another ticket.`)],
    }).catch(() => {});
    return;
  }

  const openCount = await ticketQueries.countOpenByUser(interaction.guild.id, interaction.user.id);
  if (openCount >= MAX_OPEN_TICKETS) {
    await interaction.reply({
      ephemeral: true,
      embeds: [errorEmbed('Too many open tickets', `You have ${openCount} open ticket(s). Please wait for them to be closed before opening more.`)],
    }).catch(() => {});
    return;
  }

  const select = new StringSelectMenuBuilder()
    .setCustomId(COMPONENT_IDS.TICKET_SELECT_TYPE)
    .setPlaceholder('Choose ticket type…')
    .addOptions(
      new StringSelectMenuOptionBuilder().setLabel('Support').setDescription('General help and questions').setValue('support'),
      new StringSelectMenuOptionBuilder().setLabel('Report').setDescription('Report a user or issue').setValue('report'),
      new StringSelectMenuOptionBuilder().setLabel('Partnership').setDescription('Partnership or collaboration').setValue('partnership'),
      new StringSelectMenuOptionBuilder().setLabel('Suggestion').setDescription('Ideas and feedback').setValue('suggestion')
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
  await interaction.reply({
    ephemeral: true,
    content: 'Select a ticket type below:',
    components: [row],
  }).catch(() => {});
}
