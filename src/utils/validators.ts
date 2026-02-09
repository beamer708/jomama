/**
 * Input validators for modals and commands.
 */

const MAX_SUBJECT_LENGTH = 256;
const MAX_DESCRIPTION_LENGTH = 1024;
const MIN_DESCRIPTION_LENGTH = 10;

export function validateSubject(input: string | null | undefined): { ok: true; value: string } | { ok: false; error: string } {
  const s = (input ?? '').trim();
  if (s.length === 0) return { ok: false, error: 'Subject is required.' };
  if (s.length > MAX_SUBJECT_LENGTH) return { ok: false, error: `Subject must be ${MAX_SUBJECT_LENGTH} characters or less.` };
  return { ok: true, value: s };
}

export function validateDescription(input: string | null | undefined): { ok: true; value: string } | { ok: false; error: string } {
  const s = (input ?? '').trim();
  if (s.length < MIN_DESCRIPTION_LENGTH) return { ok: false, error: `Please provide at least ${MIN_DESCRIPTION_LENGTH} characters.` };
  if (s.length > MAX_DESCRIPTION_LENGTH) return { ok: false, error: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less.` };
  return { ok: true, value: s };
}

export function validateTicketType(type: string): type is 'support' | 'report' | 'partnership' | 'suggestion' {
  return ['support', 'report', 'partnership', 'suggestion'].includes(type);
}
