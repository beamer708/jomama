import type { Client } from 'discord.js';
import * as ready from './ready.js';
import * as interactionCreate from './interactionCreate.js';
import * as guildMemberAdd from './guildMemberAdd.js';

const events = [ready, interactionCreate, guildMemberAdd] as const;

export function registerEvents(client: Client): void {
  for (const event of events) {
    const once = 'once' in event && event.once;
    if (once) {
      client.once(event.name, (...args: unknown[]) => (event as { execute: (...a: unknown[]) => void }).execute(...args));
    } else {
      client.on(event.name, (...args: unknown[]) => (event as { execute: (...a: unknown[]) => void }).execute(...args));
    }
  }
}
