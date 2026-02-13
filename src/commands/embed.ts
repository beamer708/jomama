import { EmbedBuilder } from "discord.js";

const COLOR = 0x2f3136;

export function createEmbed(options: {
  title: string;
  description?: string;
  fields?: { name: string; value: string }[];
}): EmbedBuilder {
  const embed = new EmbedBuilder().setColor(COLOR).setTitle(options.title);
  if (options.description) embed.setDescription(options.description);
  if (options.fields?.length) {
    embed.addFields(options.fields.slice(0, 2));
  }
  return embed;
}
