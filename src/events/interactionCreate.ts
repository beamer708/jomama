import type { Interaction } from "discord.js";
import { commands } from "../commands/index.js";

export const name = "interactionCreate";

export async function execute(interaction: Interaction): Promise<void> {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.find((c) => c.data.name === interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`Command ${interaction.commandName}:`, err);
    const content = "Something went wrong.";
    if (interaction.deferred) {
      await interaction.editReply({ content }).catch(() => {});
    } else if (!interaction.replied) {
      await interaction.reply({ content, ephemeral: true }).catch(() => {});
    }
  }
}
