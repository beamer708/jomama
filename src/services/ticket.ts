import type { Guild, GuildChannel, TextChannel, User } from 'discord.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } from 'discord.js';
import { COMPONENT_IDS } from '../utils/constants.js';
import { TicketStatus, TicketType } from '@prisma/client';
import { guildQueries, ticketQueries } from '../database/queries.js';
import { sendLog } from './logging.js';
import { ticketEmbed } from '../utils/embeds.js';
import type { TicketTypeId } from '../utils/constants.js';

const TICKET_CHANNEL_OVERWRITES = (userId: string, supportRoleIds: string[]) => {
  const allowView = [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks];
  const denyAll = [PermissionFlagsBits.ViewChannel];
  return [
    { id: userId, allow: allowView, deny: [] },
    ...supportRoleIds.map((roleId) => ({ id: roleId, allow: allowView, deny: [] })),
    { id: 'everyone', allow: [], deny: denyAll },
  ];
};

export async function createTicketChannel(
  guild: Guild,
  user: User,
  type: TicketTypeId,
  subject: string | null,
  description: string | null
): Promise<{ channel: TextChannel; ticketNumber: number }> {
  const config = await guildQueries.getOrCreate(guild.id);
  const categoryId = config.ticketCategoryId ?? process.env.TICKET_CATEGORY_ID ?? null;
  const supportRoleIds = guildQueries.getSupportRoleIds(config);
  const ticketNumber = await guildQueries.incrementTicketCounter(guild.id);

  const channelName = `ticket-${String(ticketNumber).padStart(4, '0')}`;
  const channel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: categoryId,
    permissionOverwrites: TICKET_CHANNEL_OVERWRITES(user.id, supportRoleIds),
    topic: `Ticket #${ticketNumber} · ${type} · ${user.tag}`,
  }) as TextChannel;

  await ticketQueries.create({
    guildId: guild.id,
    channelId: channel.id,
    userId: user.id,
    type: type as TicketType,
    subject,
    description,
  });

  const member = await guild.members.fetch(user.id).catch(() => null);
  const displayName = member?.displayName ?? user.username;

  const embed = ticketEmbed({
    ticketType: type,
    subject,
    description,
    userName: displayName,
    userTag: user.tag,
    ticketNumber,
  });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(COMPONENT_IDS.TICKET_CLOSE).setLabel('Close ticket').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(COMPONENT_IDS.TICKET_ESCALATE).setLabel('Escalate').setStyle(ButtonStyle.Primary)
  );

  await channel.send({
    content: `${user}, your ticket has been created. Staff will assist you shortly.`,
    embeds: [embed],
    components: [row],
  });

  await sendLog(guild, {
    type: 'ticket_created',
    guild,
    channelId: channel.id,
    user,
    ticketType: type,
    ticketNumber,
  });

  return { channel, ticketNumber };
}

export async function closeTicketChannel(guild: Guild, channel: GuildChannel, closedBy: User): Promise<void> {
  const ticket = await ticketQueries.findByChannel(channel.id);
  if (ticket) {
    const config = await guildQueries.getOrCreate(guild.id);
    await ticketQueries.update(ticket.id, {
      status: TicketStatus.Closed,
      closedAt: new Date(),
      closedBy: closedBy.id,
    });
    await sendLog(guild, {
      type: 'ticket_closed',
      guild,
      channelId: channel.id,
      closedBy,
      ticketNumber: config.ticketCounter,
    });
  }
  await channel.delete('Ticket closed').catch(() => {});
}

export async function reopenTicket(ticketId: string, _reopenedBy: User): Promise<void> {
  await ticketQueries.update(ticketId, {
    status: TicketStatus.Reopened,
    closedAt: null,
    closedBy: null,
  });
}

export async function escalateTicket(ticketId: string, _escalatedBy: User): Promise<void> {
  await ticketQueries.update(ticketId, {
    status: TicketStatus.Escalated,
    escalatedAt: new Date(),
  });
}
