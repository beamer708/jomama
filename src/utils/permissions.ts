import type { GuildMember, PermissionResolvable } from 'discord.js';
import { guildQueries } from '../database/queries.js';

const ADMIN_PERMISSIONS: PermissionResolvable = ['ManageChannels', 'ManageRoles', 'ModerateMembers', 'ViewChannel', 'SendMessages', 'ManageMessages'];

/**
 * Returns true if the member has any of the guild's configured support roles
 * or has admin-level permissions.
 */
export async function canManageTickets(member: GuildMember): Promise<boolean> {
  if (member.permissions.has(ADMIN_PERMISSIONS)) return true;
  const config = await guildQueries.getOrCreate(member.guild.id);
  const roleIds = guildQueries.getSupportRoleIds(config);
  if (roleIds.length === 0) return false;
  return roleIds.some((roleId) => member.roles.cache.has(roleId));
}

/**
 * Returns true if the member can close/reopen/escalate tickets (staff).
 */
export async function isStaff(member: GuildMember): Promise<boolean> {
  return canManageTickets(member);
}

/**
 * Assert member has ticket management permission; throws descriptive error if not.
 */
export async function requireTicketPermission(member: GuildMember): Promise<void> {
  const allowed = await canManageTickets(member);
  if (!allowed) {
    throw new Error('You do not have permission to manage tickets in this server.');
  }
}
