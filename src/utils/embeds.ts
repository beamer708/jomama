import {
  EmbedBuilder,
  type APIEmbed,
  type ColorResolvable,
} from 'discord.js';
import { BRAND } from './constants.js';

export function brandColor(): ColorResolvable {
  return BRAND.color as ColorResolvable;
}

export function baseEmbed(options: {
  title?: string;
  description?: string;
  url?: string;
  thumbnail?: string;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  footer?: string;
  timestamp?: boolean;
}): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(brandColor())
    .setFooter({ text: options.footer ?? BRAND.footerText });
  if (options.title) embed.setTitle(options.title);
  if (options.description) embed.setDescription(options.description);
  if (options.url) embed.setURL(options.url);
  if (options.thumbnail) embed.setThumbnail(options.thumbnail);
  if (options.timestamp) embed.setTimestamp();
  if (options.fields?.length) {
    embed.addFields(
      options.fields.map((f) => ({
        name: f.name,
        value: f.value,
        inline: f.inline ?? false,
      }))
    );
  }
  return embed;
}

export function successEmbed(title: string, description: string): EmbedBuilder {
  return baseEmbed({
    title: `✅ ${title}`,
    description,
    timestamp: true,
  }).setColor(0x57f287 as ColorResolvable);
}

export function errorEmbed(title: string, description: string): EmbedBuilder {
  return baseEmbed({
    title: `❌ ${title}`,
    description,
    timestamp: true,
  }).setColor(0xed4245 as ColorResolvable);
}

export function ticketEmbed(options: {
  ticketType: string;
  subject: string | null;
  description: string | null;
  userName: string;
  userTag: string;
  ticketNumber: number;
}): EmbedBuilder {
  return baseEmbed({
    title: `Ticket · ${options.ticketType}`,
    description: [
      options.subject ? `**Subject:** ${options.subject}` : null,
      options.description ? `**Details:**\n${options.description}` : null,
    ]
      .filter(Boolean)
      .join('\n\n') || 'No additional details provided.',
    fields: [
      { name: 'Opened by', value: `${options.userName} (\`${options.userTag}\`)`, inline: true },
      { name: 'Ticket #', value: String(options.ticketNumber), inline: true },
    ],
    timestamp: true,
  });
}

export function ticketPanelEmbed(): EmbedBuilder {
  return baseEmbed({
    title: 'Support & Feedback',
    description:
      '**Unity Vault** uses a ticket system for support, reports, partnerships, and suggestions.\n\n' +
      'Click **Open a ticket** below and choose a type. You may be asked to fill a short form.\n\n' +
      '• **Support** – General help and questions\n' +
      '• **Report** – Report a user or issue\n' +
      '• **Partnership** – Partnership or collaboration inquiries\n' +
      '• **Suggestion** – Ideas and feedback for the server',
    timestamp: true,
  });
}

export function toAPIEmbed(embed: EmbedBuilder): APIEmbed {
  return embed.toJSON();
}
