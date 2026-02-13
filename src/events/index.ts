import type { Client } from "discord.js";
import * as interactionCreate from "./interactionCreate.js";
import * as ready from "./ready.js";

const events = [ready, interactionCreate];

export function registerEvents(client: Client): void {
  for (const event of events) {
    if ("once" in event && event.once) {
      client.once(event.name, (...args: unknown[]) =>
        (event as { execute: (...a: unknown[]) => void }).execute(...args)
      );
    } else {
      client.on(event.name, (...args: unknown[]) =>
        (event as { execute: (...a: unknown[]) => void }).execute(...args)
      );
    }
  }
}
