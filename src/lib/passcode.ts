const COMMON = new Set([
  "password",
  "password123",
  "12345678",
  "123456789",
  "1234567890",
  "qwerty",
  "qwerty123",
  "qwertyuiop",
  "letmein",
  "admin",
  "welcome",
  "passw0rd",
  "p@ssw0rd",
  "iloveyou",
  "monkey",
  "dragon",
  "master",
  "football",
  "baseball",
  "superman",
  "batman",
  "changeme",
  "change-me",
  "mine2024",
  "mine2025",
  "mine2026",
  "mine-passcode",
  "secondbrain",
  "secondbrain123",
]);

export type PasscodeValidation =
  | { ok: true }
  | { ok: false; error: string };

export function validatePasscode(pc: string | undefined): PasscodeValidation {
  if (!pc) return { ok: false, error: "APP_PASSCODE is not set" };
  if (pc.length < 12) {
    return { ok: false, error: `APP_PASSCODE must be at least 12 chars (got ${pc.length})` };
  }
  if (pc.length > 200) return { ok: false, error: "APP_PASSCODE must be <= 200 chars" };

  const lower = /[a-z]/.test(pc);
  const upper = /[A-Z]/.test(pc);
  const digit = /[0-9]/.test(pc);
  const symbol = /[^A-Za-z0-9]/.test(pc);
  const classes = [lower, upper, digit, symbol].filter(Boolean).length;
  if (classes < 3) {
    return {
      ok: false,
      error:
        "APP_PASSCODE must mix at least 3 of: lowercase, uppercase, digit, symbol",
    };
  }

  if (COMMON.has(pc.toLowerCase())) {
    return { ok: false, error: "APP_PASSCODE is on the common-password deny list" };
  }

  if (/^(.)\1+$/.test(pc)) {
    return { ok: false, error: "APP_PASSCODE cannot be a single repeating character" };
  }

  return { ok: true };
}

let _validated = false;
export function assertPasscodeOk(): void {
  if (_validated) return;
  const res = validatePasscode(process.env.APP_PASSCODE);
  if (!res.ok) {
    throw new Error(res.error);
  }
  _validated = true;
}
