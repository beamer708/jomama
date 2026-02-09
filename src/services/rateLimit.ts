import { rateLimitQueries } from '../database/queries.js';
import { RATE_LIMITS } from '../utils/constants.js';

export type RateLimitKey =
  | { kind: 'slash'; commandName: string; userId: string }
  | { kind: 'ticket_create'; userId: string; guildId: string }
  | { kind: 'button'; customId: string; userId: string };

function keyToString(k: RateLimitKey): string {
  switch (k.kind) {
    case 'slash':
      return `slash:${k.commandName}:${k.userId}`;
    case 'ticket_create':
      return `ticket:create:${k.guildId}:${k.userId}`;
    case 'button':
      return `btn:${k.customId}:${k.userId}`;
  }
}

export async function checkRateLimit(key: RateLimitKey): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  const str = keyToString(key);
  let limit: number;
  let windowSeconds: number;
  switch (key.kind) {
    case 'slash':
      limit = RATE_LIMITS.SLASH_COMMAND.limit;
      windowSeconds = RATE_LIMITS.SLASH_COMMAND.windowSeconds;
      break;
    case 'ticket_create':
      limit = RATE_LIMITS.TICKET_CREATE.limit;
      windowSeconds = RATE_LIMITS.TICKET_CREATE.windowSeconds;
      break;
    case 'button':
      limit = RATE_LIMITS.BUTTON_INTERACTION.limit;
      windowSeconds = RATE_LIMITS.BUTTON_INTERACTION.windowSeconds;
      break;
  }
  const { allowed } = await rateLimitQueries.check(str, limit, windowSeconds);
  return { allowed, retryAfterSeconds: allowed ? undefined : windowSeconds };
}
