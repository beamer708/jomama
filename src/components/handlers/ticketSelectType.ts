import type { StringSelectMenuInteraction } from 'discord.js';
import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import { COMPONENT_IDS } from '../../utils/constants.js';

const MODAL_IDS: Record<string, string> = {
  support: COMPONENT_IDS.MODAL_TICKET_SUPPORT,
  report: COMPONENT_IDS.MODAL_TICKET_REPORT,
  partnership: COMPONENT_IDS.MODAL_TICKET_PARTNERSHIP,
  suggestion: COMPONENT_IDS.MODAL_TICKET_SUGGESTION,
};

const LABELS: Record<string, { subject: string; description: string }> = {
  support: { subject: 'Subject', description: 'Describe your issue or question' },
  report: { subject: 'Subject (e.g. username or brief summary)', description: 'What happened? Include details and evidence if possible.' },
  partnership: { subject: 'Organization / project name', description: 'Tell us about your project and what you\'re looking for' },
  suggestion: { subject: 'Suggestion title', description: 'Describe your idea or feedback' },
};

export async function handleTicketSelectType(interaction: StringSelectMenuInteraction): Promise<void> {
  const value = interaction.values[0];
  if (!value || !MODAL_IDS[value]) return;

  const customId = MODAL_IDS[value];
  const labels = LABELS[value] ?? { subject: 'Subject', description: 'Description' };

  const subjectInput = new TextInputBuilder()
    .setCustomId('subject')
    .setLabel(labels.subject)
    .setStyle(TextInputStyle.Short)
    .setMaxLength(256)
    .setRequired(true);

  const descriptionInput = new TextInputBuilder()
    .setCustomId('description')
    .setLabel(labels.description)
    .setStyle(TextInputStyle.Paragraph)
    .setMinLength(10)
    .setMaxLength(1024)
    .setRequired(true);

  const modal = new ModalBuilder()
    .setCustomId(customId)
    .setTitle(`Ticket: ${value}`)
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(subjectInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput)
    );

  await interaction.showModal(modal).catch(() => {});
}
