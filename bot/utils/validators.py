"""Input validation for modals and commands."""
from bot.constants import MAX_DESCRIPTION_LENGTH, MAX_SUBJECT_LENGTH, MIN_DESCRIPTION_LENGTH


def validate_subject(value: str | None) -> tuple[bool, str, str]:
    """Returns (ok, message, value)."""
    s = (value or "").strip()
    if not s:
        return False, "Subject is required.", ""
    if len(s) > MAX_SUBJECT_LENGTH:
        return False, f"Subject must be {MAX_SUBJECT_LENGTH} characters or less.", ""
    return True, "", s


def validate_description(value: str | None) -> tuple[bool, str, str]:
    s = (value or "").strip()
    if len(s) < MIN_DESCRIPTION_LENGTH:
        return False, f"Please provide at least {MIN_DESCRIPTION_LENGTH} characters.", ""
    if len(s) > MAX_DESCRIPTION_LENGTH:
        return False, f"Description must be {MAX_DESCRIPTION_LENGTH} characters or less.", ""
    return True, "", s


def validate_ticket_type(t: str) -> bool:
    return t in ("support", "report", "partnership", "suggestion")
