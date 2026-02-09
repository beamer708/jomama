import type { ChatInputCommandInteraction } from 'discord.js';
import { baseEmbed } from '../utils/embeds.js';
import { prisma } from '../database/client.js';
import { checkRateLimit } from '../services/rateLimit.js';

export const name = 'status';
export const description = 'Bot health and database status (showcase)';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const { allowed } = await checkRateLimit({
    kind: 'slash',
    commandName: name,
    userId: interaction.user.id,
  });
  if (!allowed) {
    await interaction.reply({ content: 'Rate limited. Try again in a minute.', ephemeral: true }).catch(() => {});
    return;
  }

  let dbStatus: string;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'Connected';
  } catch {
    dbStatus = 'Disconnected';
  }

  const embed = baseEmbed({
    title: 'Status',
    description: 'Unity Vault Bot health check.',
    fields: [
      { name: 'Database', value: dbStatus, inline: true },
      { name: 'WebSocket', value: `${interaction.client.ws.ping} ms`, inline: true },
      { name: 'Uptime', value: formatUptime(interaction.client.uptime ?? 0), inline: true },
    ],
    timestamp: true,
  });

  await interaction.reply({ ephemeral: true, embeds: [embed] }).catch(() => {});
}

function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}
