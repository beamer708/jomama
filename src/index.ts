import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import { registerEvents } from './events/index.js';
import { prisma } from './database/client.js';

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('Missing DISCORD_TOKEN in environment.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
  ],
});

registerEvents(client);

client.login(token).catch((err) => {
  console.error('Login failed:', err);
  process.exit(1);
});

async function shutdown(): Promise<void> {
  client.destroy();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
