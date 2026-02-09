"""Load and expose environment config."""
import os
from dotenv import load_dotenv

load_dotenv()

DISCORD_TOKEN = os.getenv("DISCORD_TOKEN")
DISCORD_CLIENT_ID = os.getenv("DISCORD_CLIENT_ID")
DATABASE_URL = os.getenv("DATABASE_URL")
GUILD_ID = os.getenv("GUILD_ID")  # optional: single guild for command sync
LOG_CHANNEL_ID = os.getenv("LOG_CHANNEL_ID")
TICKET_CATEGORY_ID = os.getenv("TICKET_CATEGORY_ID")
SUPPORT_ROLE_IDS = (os.getenv("SUPPORT_ROLE_IDS") or "").strip()
ONBOARDING_CHANNEL_ID = os.getenv("ONBOARDING_CHANNEL_ID")
