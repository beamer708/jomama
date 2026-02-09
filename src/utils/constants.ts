/**
 * Central constants and customId prefixes for Components v2.
 * All component customIds should be prefixed and documented here for routing.
 */

export const BRAND = {
  name: 'Unity Vault',
  url: 'https://www.unityvault.space/',
  color: 0x1a5fb4, // Discord Blurple variant / vault accent
  footerText: 'Unity Vault • ERLC Community Resource Vault',
} as const;

/** CustomId prefix → handler mapping; max 100 chars for customId */
export const COMPONENT_IDS = {
  /** ticket:open → opens ticket type select or modal */
  TICKET_OPEN: 'ticket:open',
  /** ticket:select:type → select menu for ticket type */
  TICKET_SELECT_TYPE: 'ticket:select:type',
  /** ticket:type:${type} → e.g. ticket:type:support (legacy/fallback) */
  TICKET_TYPE_PREFIX: 'ticket:type:',
  /** ticket:close */
  TICKET_CLOSE: 'ticket:close',
  /** ticket:close:confirm */
  TICKET_CLOSE_CONFIRM: 'ticket:close:confirm',
  /** ticket:reopen */
  TICKET_REOPEN: 'ticket:reopen',
  /** ticket:escalate */
  TICKET_ESCALATE: 'ticket:escalate',
  /** ticket:claim (optional staff) */
  TICKET_CLAIM: 'ticket:claim',
  /** Modal customIds */
  MODAL_TICKET_SUPPORT: 'modal:ticket:support',
  MODAL_TICKET_REPORT: 'modal:ticket:report',
  MODAL_TICKET_PARTNERSHIP: 'modal:ticket:partnership',
  MODAL_TICKET_SUGGESTION: 'modal:ticket:suggestion',
} as const;

export const TICKET_TYPES = ['support', 'report', 'partnership', 'suggestion'] as const;
export type TicketTypeId = (typeof TICKET_TYPES)[number];

export const RATE_LIMITS = {
  SLASH_COMMAND: { limit: 5, windowSeconds: 60 },
  TICKET_CREATE: { limit: 3, windowSeconds: 300 },
  BUTTON_INTERACTION: { limit: 30, windowSeconds: 60 },
} as const;

export const TICKET_STATE_TTL_SECONDS = 900; // 15 min for modal → submit flow
