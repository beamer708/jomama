import type { ChatInputCommandInteraction } from 'discord.js';
import { baseEmbed } from '../utils/embeds.js';
import { BRAND } from '../utils/constants.js';
import { checkRateLimit } from '../services/rateLimit.js';

export const name = 'help';
export const description = 'Show bot commands and info';

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

  const embed = baseEmbed({
    title: `${BRAND.name} Bot`,
    description: `Welcome to the **${BRAND.name}** Discord helper bot.`,
    url: BRAND.url,
    fields: [
      { name: 'Commands', value: '`/ping` – Latency and status\n`/help` – This message\n`/ticket-panel` – Post ticket panel (staff)\n`/config` – View or set server config (staff)\n`/status` – Health check', inline: false },
      { name: 'Tickets', value: 'Use the **Open a ticket** button in the support channel to open a ticket. Choose a type (Support, Report, Partnership, Suggestion) and fill the form.', inline: false },
    ],
    timestamp: true,
  });

  await interaction.reply({ ephemeral: true, embeds: [embed] }).catch(() => {});
}
