import type { GuildMember } from 'discord.js';
import { baseEmbed } from '../utils/embeds.js';
import { guildQueries } from '../database/queries.js';
import { BRAND } from '../utils/constants.js';

export const name = 'guildMemberAdd';

export async function execute(member: GuildMember): Promise<void> {
  const config = await guildQueries.getOrCreate(member.guild.id);
  const channelId = config.onboardingChannelId ?? process.env.ONBOARDING_CHANNEL_ID;
  if (!channelId) return;

  const channel = await member.guild.channels.fetch(channelId).catch(() => null);
  if (!channel?.isTextBased() || channel.isDMBased()) return;

  const embed = baseEmbed({
    title: `Welcome to ${BRAND.name}`,
    description: `Welcome, **${member.user.tag}**! Check out the server and use \`/help\` for bot commands.`,
    thumbnail: member.user.displayAvatarURL({ size: 128 }),
    timestamp: true,
  });

  await channel.send({ content: `${member}`, embeds: [embed] }).catch(() => {});
}
