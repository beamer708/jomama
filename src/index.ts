import "dotenv/config";
import { Client, GatewayIntentBits, REST, Routes } from "discord.js";
import { connect } from "./database/connect.js";
import { commands } from "./commands/index.js";
import { registerEvents } from "./events/index.js";

const token = process.env.DISCORD_TOKEN ?? "";
const clientId = process.env.DISCORD_CLIENT_ID ?? "";

if (!token || !clientId) {
  console.error("DISCORD_TOKEN and DISCORD_CLIENT_ID are required in .env");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

registerEvents(client);

async function main(): Promise<void> {
  await connect();

  const rest = new REST().setToken(token);
  const body = commands.map((c) => c.data.toJSON());
  await rest.put(Routes.applicationCommands(clientId), { body });

  await client.login(token);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
