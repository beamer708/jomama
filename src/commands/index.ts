import type { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import * as help from "./help.js";
import * as ping from "./ping.js";
import * as status from "./status.js";

export interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export const commands: Command[] = [
  { data: ping.data, execute: ping.execute },
  { data: help.data, execute: help.execute },
  { data: status.data, execute: status.execute },
];
