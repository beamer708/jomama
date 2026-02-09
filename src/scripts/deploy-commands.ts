import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { commands } from '../commands/index.js';

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.GUILD_ID; // optional: deploy to one guild for faster updates

if (!token || !clientId) {
  console.error('Set DISCORD_TOKEN and DISCORD_CLIENT_ID in .env');
  process.exit(1);
}

const body = commands.map((c) => (c.data ? c.data.toJSON() : { name: c.name, description: c.description }));

const rest = new REST().setToken(token);

(async () => {
  try {
    if (guildId) {
      const result = await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body }
      ) as unknown[];
      console.info(`Registered ${result.length} guild commands for guild ${guildId}.`);
    } else {
      const result = await rest.put(
        Routes.applicationCommands(clientId),
        { body }
      ) as unknown[];
      console.info(`Registered ${result.length} global slash commands.`);
    }
  } catch (err) {
    console.error('Deploy failed:', err);
    process.exit(1);
  }
})();
