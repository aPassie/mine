import { supabase } from "./supabase";

const WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 30 * 60 * 1000;
const MAX_FAILS = 5;

export type RateCheck =
  | { allowed: true }
  | { allowed: false; retryAfterMs: number; reason: "locked" | "too_many" };

export async function checkLoginRate(ip: string): Promise<RateCheck> {
  const windowStart = new Date(Date.now() - WINDOW_MS).toISOString();
  const lockoutStart = new Date(Date.now() - LOCKOUT_MS).toISOString();

  const { data, error } = await supabase
    .from("login_attempts")
    .select("success, ts")
    .eq("ip", ip)
    .gte("ts", lockoutStart)
    .order("ts", { ascending: false })
    .limit(20);

  if (error || !data) return { allowed: true };

  const fails = data.filter((r) => !r.success);
  const recentFailsInWindow = fails.filter((r) => r.ts >= windowStart);

  if (recentFailsInWindow.length >= MAX_FAILS) {
    const latest = new Date(fails[0].ts).getTime();
    const retryAt = latest + LOCKOUT_MS;
    const retryAfterMs = Math.max(0, retryAt - Date.now());
    if (retryAfterMs > 0) {
      return { allowed: false, retryAfterMs, reason: "locked" };
    }
  }
  return { allowed: true };
}

export async function recordLoginAttempt(ip: string, success: boolean): Promise<void> {
  try {
    await supabase.from("login_attempts").insert({ ip, success });
    if (success) {
      const cutoff = new Date(Date.now() - WINDOW_MS).toISOString();
      await supabase
        .from("login_attempts")
        .delete()
        .eq("ip", ip)
        .eq("success", false)
        .lt("ts", cutoff);
    }
  } catch {
    /* */
  }
}

export function formatRetryAfter(ms: number): string {
  const s = Math.ceil(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.ceil(s / 60);
  return `${m}m`;
}
