import type { ModalSubmitInteraction } from 'discord.js';
import { createTicketChannel } from '../../services/ticket.js';
import { validateSubject, validateDescription } from '../../utils/validators.js';
import { errorEmbed } from '../../utils/embeds.js';
import { COMPONENT_IDS } from '../../utils/constants.js';
import type { TicketTypeId } from '../../utils/constants.js';

const MODAL_TO_TYPE: Record<string, TicketTypeId> = {
  [COMPONENT_IDS.MODAL_TICKET_SUPPORT]: 'support',
  [COMPONENT_IDS.MODAL_TICKET_REPORT]: 'report',
  [COMPONENT_IDS.MODAL_TICKET_PARTNERSHIP]: 'partnership',
  [COMPONENT_IDS.MODAL_TICKET_SUGGESTION]: 'suggestion',
};

export async function handleModalTicket(interaction: ModalSubmitInteraction): Promise<void> {
  if (!interaction.guild) return;

  const type = MODAL_TO_TYPE[interaction.customId];
  if (!type) return;

  const subjectRaw = interaction.fields.getTextInputValue('subject');
  const descriptionRaw = interaction.fields.getTextInputValue('description');

  const subjectResult = validateSubject(subjectRaw);
  const descriptionResult = validateDescription(descriptionRaw);

  if (!subjectResult.ok) {
    await interaction.reply({ ephemeral: true, embeds: [errorEmbed('Invalid input', subjectResult.error)] }).catch(() => {});
    return;
  }
  if (!descriptionResult.ok) {
    await interaction.reply({ ephemeral: true, embeds: [errorEmbed('Invalid input', descriptionResult.error)] }).catch(() => {});
    return;
  }

  await interaction.deferReply({ ephemeral: true }).catch(() => {});

  try {
    const { channel } = await createTicketChannel(
      interaction.guild,
      interaction.user,
      type,
      subjectResult.value,
      descriptionResult.value
    );
    await interaction.editReply({
      content: `Your ticket has been created: <#${channel.id}>`,
      embeds: [],
    }).catch(() => {});
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create ticket.';
    await interaction.editReply({
      content: null,
      embeds: [errorEmbed('Could not create ticket', message)],
    }).catch(() => {});
  }
}
