import type { Guild, TextChannel, User } from 'discord.js';
import { guildQueries } from '../database/queries.js';
import { baseEmbed } from '../utils/embeds.js';

export type LogEvent =
  | { type: 'ticket_created'; guild: Guild; channelId: string; user: User; ticketType: string; ticketNumber: number }
  | { type: 'ticket_closed'; guild: Guild; channelId: string; closedBy: User; ticketNumber?: number }
  | { type: 'ticket_reopened'; guild: Guild; channelId: string; reopenedBy: User }
  | { type: 'ticket_escalated'; guild: Guild; channelId: string; escalatedBy: User }
  | { type: 'mod_action'; guild: Guild; action: string; target: string; moderator: User; reason?: string };

export async function sendLog(guild: Guild, event: LogEvent): Promise<void> {
  const config = await guildQueries.getOrCreate(guild.id);
  const logChannelId = config.logChannelId ?? process.env.LOG_CHANNEL_ID;
  if (!logChannelId) return;

  const channel = await guild.channels.fetch(logChannelId).catch(() => null);
  if (!channel?.isTextBased() || channel.isDMBased()) return;

  const embed = baseEmbed({ timestamp: true });
  switch (event.type) {
    case 'ticket_created':
      embed
        .setTitle('Ticket Created')
        .setColor(0x57f287)
        .addFields(
          { name: 'Channel', value: `<#${event.channelId}>`, inline: true },
          { name: 'User', value: `${event.user.tag} (${event.user.id})`, inline: true },
          { name: 'Type', value: event.ticketType, inline: true },
          { name: 'Ticket #', value: String(event.ticketNumber), inline: false }
        );
      break;
    case 'ticket_closed':
      embed
        .setTitle('Ticket Closed')
        .setColor(0xfee75c)
        .addFields(
          { name: 'Channel', value: `<#${event.channelId}>`, inline: true },
          { name: 'Closed by', value: `${event.closedBy.tag}`, inline: true },
          { name: 'Ticket #', value: event.ticketNumber != null ? String(event.ticketNumber) : '—', inline: true }
        );
      break;
    case 'ticket_reopened':
      embed
        .setTitle('Ticket Reopened')
        .setColor(0x57f287)
        .addFields(
          { name: 'Channel', value: `<#${event.channelId}>`, inline: true },
          { name: 'Reopened by', value: `${event.reopenedBy.tag}`, inline: true }
        );
      break;
    case 'ticket_escalated':
      embed
        .setTitle('Ticket Escalated')
        .setColor(0xeb459e)
        .addFields(
          { name: 'Channel', value: `<#${event.channelId}>`, inline: true },
          { name: 'Escalated by', value: `${event.escalatedBy.tag}`, inline: true }
        );
      break;
    case 'mod_action':
      embed
        .setTitle(`Moderation: ${event.action}`)
        .setColor(0xed4245)
        .addFields(
          { name: 'Target', value: event.target, inline: true },
          { name: 'Moderator', value: `${event.moderator.tag}`, inline: true },
          ...(event.reason ? [{ name: 'Reason', value: event.reason, inline: false }] : [])
        );
      break;
  }

  await (channel as TextChannel).send({ embeds: [embed] }).catch(() => {});
}
