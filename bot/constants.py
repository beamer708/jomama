"""Central constants and custom_id prefixes for component routing."""

BRAND = {
    "name": "Unity Vault",
    "url": "https://www.unityvault.space/",
    "color": 0x1A5FB4,
    "footer_text": "Unity Vault • ERLC Community Resource Vault",
}

TICKET_OPEN = "ticket:open"
TICKET_SELECT_TYPE = "ticket:select:type"
TICKET_CLOSE = "ticket:close"
TICKET_CLOSE_CONFIRM = "ticket:close:confirm"
TICKET_ESCALATE = "ticket:escalate"
MODAL_TICKET_SUPPORT = "modal:ticket:support"
MODAL_TICKET_REPORT = "modal:ticket:report"
MODAL_TICKET_PARTNERSHIP = "modal:ticket:partnership"
MODAL_TICKET_SUGGESTION = "modal:ticket:suggestion"

TICKET_TYPES = ("support", "report", "partnership", "suggestion")
MODAL_BY_TYPE = {
    "support": MODAL_TICKET_SUPPORT,
    "report": MODAL_TICKET_REPORT,
    "partnership": MODAL_TICKET_PARTNERSHIP,
    "suggestion": MODAL_TICKET_SUGGESTION,
}

RATE_LIMITS = {
    "slash": (5, 60),
    "ticket_create": (3, 300),
    "button": (30, 60),
}

MAX_OPEN_TICKETS_PER_USER = 2
MAX_SUBJECT_LENGTH = 256
MIN_DESCRIPTION_LENGTH = 10
MAX_DESCRIPTION_LENGTH = 1024
