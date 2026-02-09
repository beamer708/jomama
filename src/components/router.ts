import type { ButtonInteraction, ModalSubmitInteraction, StringSelectMenuInteraction } from 'discord.js';
import { COMPONENT_IDS } from '../utils/constants.js';
import { handleTicketOpen } from './handlers/ticketOpen.js';
import { handleTicketClose } from './handlers/ticketClose.js';
import { handleTicketCloseConfirm } from './handlers/ticketCloseConfirm.js';
import { handleTicketEscalate } from './handlers/ticketEscalate.js';
import { handleTicketSelectType } from './handlers/ticketSelectType.js';
import { handleModalTicket } from './handlers/modalTicket.js';

export async function routeButton(interaction: ButtonInteraction): Promise<boolean> {
  const customId = interaction.customId;
  if (customId === COMPONENT_IDS.TICKET_OPEN) {
    await handleTicketOpen(interaction);
    return true;
  }
  if (customId === COMPONENT_IDS.TICKET_CLOSE) {
    await handleTicketClose(interaction);
    return true;
  }
  if (customId === COMPONENT_IDS.TICKET_CLOSE_CONFIRM) {
    await handleTicketCloseConfirm(interaction);
    return true;
  }
  if (customId === COMPONENT_IDS.TICKET_ESCALATE) {
    await handleTicketEscalate(interaction);
    return true;
  }
  return false;
}

export async function routeSelectMenu(interaction: StringSelectMenuInteraction): Promise<boolean> {
  if (interaction.customId === COMPONENT_IDS.TICKET_SELECT_TYPE) {
    await handleTicketSelectType(interaction);
    return true;
  }
  return false;
}

const MODAL_TICKET_IDS = [
  COMPONENT_IDS.MODAL_TICKET_SUPPORT,
  COMPONENT_IDS.MODAL_TICKET_REPORT,
  COMPONENT_IDS.MODAL_TICKET_PARTNERSHIP,
  COMPONENT_IDS.MODAL_TICKET_SUGGESTION,
] as const;

export async function routeModal(interaction: ModalSubmitInteraction): Promise<boolean> {
  const customId = interaction.customId;
  if (MODAL_TICKET_IDS.includes(customId as (typeof MODAL_TICKET_IDS)[number])) {
    await handleModalTicket(interaction);
    return true;
  }
  return false;
}
