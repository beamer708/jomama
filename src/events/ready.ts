import type { Client } from 'discord.js';
import { ActivityType } from 'discord.js';
import { interactionStateQueries } from '../database/queries.js';

export const name = 'ready';
export const once = true;

export function execute(client: Client<true>): void {
  console.info(`Logged in as ${client.user.tag} (${client.user.id}).`);

  void client.user.setActivity({
    name: 'Unity Vault',
    type: ActivityType.Watching,
    url: 'https://www.unityvault.space/',
  });

  // Optional: periodic cleanup of expired interaction state
  setInterval(() => {
    interactionStateQueries.deleteExpired().then((count) => {
      if (count > 0) console.debug(`Cleaned ${count} expired interaction states.`);
    }).catch(() => {});
  }, 60_000);
}
