import { SlashCommandBuilder } from "discord.js";
import { createEmbed } from "./embed.js";

export const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Check bot latency");

export async function execute(
  interaction: import("discord.js").ChatInputCommandInteraction
): Promise<void> {
  const latency = Math.round(interaction.client.ws.ping);
  const embed = createEmbed({
    title: "Pong",
    description: `WebSocket: ${latency} ms`,
  });
  await interaction.reply({ embeds: [embed], ephemeral: true });
}
