import type { ChatInputCommandInteraction } from 'discord.js';
import type { SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from 'discord.js';
import * as ping from './ping.js';
import * as help from './help.js';
import * as status from './status.js';
import * as ticketPanel from './ticket-panel.js';
import * as config from './config.js';

export interface SlashCommand {
  name: string;
  description: string;
  data?: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export const commands: SlashCommand[] = [
  { name: ping.name, description: ping.description, execute: ping.execute },
  { name: help.name, description: help.description, execute: help.execute },
  { name: status.name, description: status.description, execute: status.execute },
  { name: ticketPanel.name, description: ticketPanel.description, execute: ticketPanel.execute },
  { name: config.name, description: config.description, data: config.data, execute: config.execute },
];

const byName = new Map<string, SlashCommand>(commands.map((c) => [c.name, c]));

export function getCommand(name: string): SlashCommand | undefined {
  return byName.get(name);
}
