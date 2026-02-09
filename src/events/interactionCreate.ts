import type { Interaction } from 'discord.js';
import { InteractionType } from 'discord.js';
import { getCommand } from '../commands/index.js';
import { routeButton, routeSelectMenu, routeModal } from '../components/router.js';
import { checkRateLimit } from '../services/rateLimit.js';
import { errorEmbed } from '../utils/embeds.js';

export const name = 'interactionCreate';

export async function execute(interaction: Interaction): Promise<void> {
  try {
    if (interaction.isChatInputCommand()) {
      const command = getCommand(interaction.commandName);
      if (command) {
        await command.execute(interaction);
      } else {
        await interaction.reply({ ephemeral: true, content: 'Unknown command.' }).catch(() => {});
      }
      return;
    }

    if (interaction.isButton()) {
      const { allowed } = await checkRateLimit({
        kind: 'button',
        customId: interaction.customId,
        userId: interaction.user.id,
      });
      if (!allowed) {
        await interaction.reply({
          ephemeral: true,
          embeds: [errorEmbed('Rate limited', 'Please slow down and try again.')],
        }).catch(() => {});
        return;
      }
      const handled = await routeButton(interaction);
      if (!handled) {
        await interaction.reply({ ephemeral: true, content: 'This button is not configured.' }).catch(() => {});
      }
      return;
    }

    if (interaction.isStringSelectMenu()) {
      const { allowed } = await checkRateLimit({
        kind: 'button',
        customId: interaction.customId,
        userId: interaction.user.id,
      });
      if (!allowed) {
        await interaction.reply({
          ephemeral: true,
          embeds: [errorEmbed('Rate limited', 'Please slow down and try again.')],
        }).catch(() => {});
        return;
      }
      const handled = await routeSelectMenu(interaction);
      if (!handled) {
        await interaction.reply({ ephemeral: true, content: 'This menu is not configured.' }).catch(() => {});
      }
      return;
    }

    if (interaction.type === InteractionType.ModalSubmit) {
      const handled = await routeModal(interaction);
      if (!handled) {
        await interaction.reply({ ephemeral: true, content: 'This form is not configured.' }).catch(() => {});
      }
      return;
    }
  } catch (err) {
    console.error('Interaction error:', err);
    const message = err instanceof Error ? err.message : 'Something went wrong.';
    const embed = errorEmbed('Error', message);
    try {
      const i = interaction as import('discord.js').CommandInteraction | import('discord.js').MessageComponentInteraction;
      if (i.deferred) {
        await i.editReply({ content: null, embeds: [embed] }).catch(() => {});
      } else if (i.replied) {
        await i.followUp({ ephemeral: true, embeds: [embed] }).catch(() => {});
      } else {
        await i.reply({ ephemeral: true, embeds: [embed] }).catch(() => {});
      }
    } catch {
      // Best-effort; user may see nothing
    }
  }
}
