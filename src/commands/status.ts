import { SlashCommandBuilder } from "discord.js";
import mongoose from "mongoose";
import { createEmbed } from "./embed.js";

export const data = new SlashCommandBuilder()
  .setName("status")
  .setDescription("Bot and database status");

export async function execute(
  interaction: import("discord.js").ChatInputCommandInteraction
): Promise<void> {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? "Connected" : "Disconnected";
  const latency = Math.round(interaction.client.ws.ping);
  const embed = createEmbed({
    title: "Status",
    description: "Service health.",
    fields: [
      { name: "Database", value: dbStatus },
      { name: "WebSocket", value: `${latency} ms` },
    ],
  });
  await interaction.reply({ embeds: [embed], ephemeral: true });
}
