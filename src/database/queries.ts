import { TicketStatus, TicketType } from '@prisma/client';
import { prisma } from './client.js';

export const guildQueries = {
  getOrCreate: async (guildId: string) => {
    let config = await prisma.guildConfig.findUnique({ where: { id: guildId } });
    if (!config) {
      config = await prisma.guildConfig.create({
        data: { id: guildId },
      });
    }
    return config;
  },

  update: async (
    guildId: string,
    data: {
      logChannelId?: string | null;
      ticketCategoryId?: string | null;
      supportRoleIds?: string;
      onboardingChannelId?: string | null;
      ticketCounter?: number;
    }
  ) => {
    return prisma.guildConfig.upsert({
      where: { id: guildId },
      create: { id: guildId, ...data },
      update: data,
    });
  },

  getSupportRoleIds: (config: { supportRoleIds: string }): string[] => {
    if (!config.supportRoleIds?.trim()) return [];
    return config.supportRoleIds.split(',').map((s) => s.trim()).filter(Boolean);
  },

  incrementTicketCounter: async (guildId: string): Promise<number> => {
    const config = await guildQueries.getOrCreate(guildId);
    const updated = await prisma.guildConfig.update({
      where: { id: guildId },
      data: { ticketCounter: config.ticketCounter + 1 },
    });
    return updated.ticketCounter;
  },
};

export const ticketQueries = {
  create: async (data: {
    guildId: string;
    channelId: string;
    userId: string;
    type: TicketType;
    subject?: string | null;
    description?: string | null;
  }) => {
    return prisma.ticket.create({ data });
  },

  findByChannel: async (channelId: string) => {
    return prisma.ticket.findUnique({ where: { channelId } });
  },

  update: async (
    ticketId: string,
    data: {
      status?: TicketStatus;
      escalatedAt?: Date | null;
      closedAt?: Date | null;
      closedBy?: string | null;
      transcriptUrl?: string | null;
    }
  ) => {
    return prisma.ticket.update({ where: { id: ticketId }, data });
  },

  countOpenByUser: async (guildId: string, userId: string): Promise<number> => {
    return prisma.ticket.count({
      where: {
        guildId,
        userId,
        status: { in: ['Open', 'Reopened', 'Escalated'] },
      },
    });
  },
};

export const interactionStateQueries = {
  set: async (customId: string, payload: object, ttlSeconds: number) => {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    return prisma.interactionState.create({
      data: {
        customId,
        payload: JSON.stringify(payload),
        expiresAt,
      },
    });
  },

  get: async (customId: string): Promise<Record<string, unknown> | null> => {
    const row = await prisma.interactionState.findFirst({
      where: { customId },
      orderBy: { createdAt: 'desc' },
    });
    if (!row || row.expiresAt < new Date()) return null;
    try {
      return JSON.parse(row.payload) as Record<string, unknown>;
    } catch {
      return null;
    }
  },

  deleteExpired: async (): Promise<number> => {
    const result = await prisma.interactionState.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  },
};

export const rateLimitQueries = {
  check: async (key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number }> => {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + windowSeconds * 1000);
    const existing = await prisma.rateLimitEntry.findUnique({ where: { key } });
    if (!existing) {
      await prisma.rateLimitEntry.upsert({
        where: { key },
        create: { key, count: 1, windowEnd },
        update: { count: 1, windowEnd },
      });
      return { allowed: true, remaining: limit - 1 };
    }
    if (existing.windowEnd < now) {
      await prisma.rateLimitEntry.update({
        where: { key },
        data: { count: 1, windowEnd },
      });
      return { allowed: true, remaining: limit - 1 };
    }
    if (existing.count >= limit) {
      return { allowed: false, remaining: 0 };
    }
    await prisma.rateLimitEntry.update({
      where: { key },
      data: { count: existing.count + 1 },
    });
    return { allowed: true, remaining: limit - existing.count - 1 };
  },
};
