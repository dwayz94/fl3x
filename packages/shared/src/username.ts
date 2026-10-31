export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;

export const RESERVED_USERNAMES = new Set([
  "admin", "administrator", "fl3x", "flex", "support", "help", "mod",
  "moderator", "staff", "team", "official", "root", "system", "null",
  "undefined", "api", "www", "mail", "dashboard", "login", "invite",
  "waitlist", "settings", "onboarding", "terms", "privacy", "about",
  "widgets", "example", "join", "you", "yourname", "username",
]);

export type UsernameCheck = { valid: true } | { valid: false; message: string };

export function validateUsername(raw: string): UsernameCheck {
  const username = raw.trim();
  if (username.length < USERNAME_MIN || username.length > USERNAME_MAX)
    return { valid: false, message: `Username must be ${USERNAME_MIN}-${USERNAME_MAX} characters` };
  if (!/^[a-zA-Z0-9_-]+$/.test(username))
    return { valid: false, message: "Only letters, numbers, _ and - are allowed" };
  if (/^[0-9_-]/.test(username))
    return { valid: false, message: "Username must start with a letter" };
  if (/[_-]$/.test(username))
    return { valid: false, message: "Username cannot end with _ or -" };
  if (/[_-]{2}/.test(username))
    return { valid: false, message: "Username cannot have consecutive _ or -" };
  if (RESERVED_USERNAMES.has(username.toLowerCase()))
    return { valid: false, message: "This username is reserved" };
  return { valid: true };
}

export function normalizeUsername(raw: string) {
  return raw.trim().toLowerCase();
}
