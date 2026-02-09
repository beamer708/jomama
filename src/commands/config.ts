import type { ChatInputCommandInteraction } from 'discord.js';
import { SlashCommandBuilder } from 'discord.js';
import { guildQueries } from '../database/queries.js';
import { requireTicketPermission } from '../utils/permissions.js';
import { baseEmbed, errorEmbed } from '../utils/embeds.js';
import { checkRateLimit } from '../services/rateLimit.js';

export const name = 'config';
export const description = 'View or set bot config for this server (staff only)';

export const data = new SlashCommandBuilder()
  .setName(name)
  .setDescription(description)
  .addSubcommand((s) => s.setName('view').setDescription('Show current config'))
  .addSubcommand((s) =>
    s
      .setName('set')
      .setDescription('Set a config value')
      .addStringOption((o) =>
        o
          .setName('key')
          .setDescription('Config key')
          .setRequired(true)
          .addChoices(
            { name: 'Log channel', value: 'logChannelId' },
            { name: 'Ticket category', value: 'ticketCategoryId' },
            { name: 'Support roles (comma-separated IDs)', value: 'supportRoleIds' },
            { name: 'Onboarding channel', value: 'onboardingChannelId' }
          )
      )
      .addStringOption((o) => o.setName('value').setDescription('Channel ID or role IDs').setRequired(false))
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const { allowed } = await checkRateLimit({
    kind: 'slash',
    commandName: name,
    userId: interaction.user.id,
  });
  if (!allowed) {
    await interaction.reply({ content: 'Rate limited. Try again in a minute.', ephemeral: true }).catch(() => {});
    return;
  }

  if (!interaction.guild) return;

  try {
    await requireTicketPermission(interaction.member as import('discord.js').GuildMember);
  } catch {
    await interaction.reply({
      ephemeral: true,
      embeds: [errorEmbed('Permission denied', 'You need staff permissions to use this command.')],
    }).catch(() => {});
    return;
  }

  const sub = interaction.options.getSubcommand();
  const config = await guildQueries.getOrCreate(interaction.guild.id);

  if (sub === 'view') {
    const embed = baseEmbed({
      title: 'Server config',
      fields: [
        { name: 'Log channel', value: config.logChannelId ? `<#${config.logChannelId}>` : 'Not set', inline: true },
        { name: 'Ticket category', value: config.ticketCategoryId ? config.ticketCategoryId : 'Not set', inline: true },
        { name: 'Support roles', value: config.supportRoleIds || 'Not set', inline: false },
        { name: 'Onboarding channel', value: config.onboardingChannelId ? `<#${config.onboardingChannelId}>` : 'Not set', inline: true },
        { name: 'Ticket counter', value: String(config.ticketCounter), inline: true },
      ],
      timestamp: true,
    });
    await interaction.reply({ ephemeral: true, embeds: [embed] }).catch(() => {});
    return;
  }

  if (sub === 'set') {
    const key = interaction.options.getString('key', true);
    const value = interaction.options.getString('value') ?? '';

    const updates: Record<string, string | null> = {};
    if (key === 'logChannelId' || key === 'ticketCategoryId' || key === 'onboardingChannelId') {
      updates[key] = value.trim() || null;
    } else if (key === 'supportRoleIds') {
      updates[key] = value.trim();
    }

    if (Object.keys(updates).length > 0) {
      await guildQueries.update(interaction.guild.id, updates as Parameters<typeof guildQueries.update>[1]);
      await interaction.reply({
        ephemeral: true,
        embeds: [baseEmbed({ title: 'Config updated', description: `Set \`${key}\` to: ${value || '(cleared)'}`, timestamp: true })],
      }).catch(() => {});
    } else {
      await interaction.reply({ ephemeral: true, embeds: [errorEmbed('Error', 'Invalid key or value.')] }).catch(() => {});
    }
  }
}
