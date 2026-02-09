import type { ChatInputCommandInteraction } from 'discord.js';
import { baseEmbed } from '../utils/embeds.js';
import { checkRateLimit } from '../services/rateLimit.js';

export const name = 'ping';
export const description = 'Check bot latency and status';

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

  const sent = await interaction.deferReply({ fetchReply: true }).catch(() => null);
  const roundtrip = sent ? Date.now() - sent.createdTimestamp : null;
  const wsLatency = interaction.client.ws.ping;

  const embed = baseEmbed({
    title: 'Pong',
    description: [
      `**WebSocket:** ${wsLatency} ms`,
      roundtrip != null ? `**Roundtrip:** ${roundtrip} ms` : null,
    ]
      .filter(Boolean)
      .join('\n'),
    timestamp: true,
  });

  await interaction.editReply({ embeds: [embed] }).catch(() => {});
}
