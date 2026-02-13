import { SlashCommandBuilder } from "discord.js";
import { createEmbed } from "./embed.js";

export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("List commands");

export async function execute(
  interaction: import("discord.js").ChatInputCommandInteraction
): Promise<void> {
  const embed = createEmbed({
    title: "Help",
    description: "Slash commands for this server.",
    fields: [
      {
        name: "Commands",
        value: "ping — Check latency\nhelp — This message\nstatus — Bot and database status",
      },
    ],
  });
  await interaction.reply({ embeds: [embed], ephemeral: true });
}
