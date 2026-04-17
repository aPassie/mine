import { supabase } from "./supabase";

export type AuditEvent =
  | "login_success"
  | "login_fail"
  | "login_lockout"
  | "logout"
  | "logout_all"
  | "entry_create"
  | "entry_update"
  | "entry_delete"
  | "entry_read_list"
  | "entry_read_search"
  | "entry_read_shuffle"
  | "tags_read";

export type AuditInput = {
  event: AuditEvent;
  ip?: string | null;
  ua?: string | null;
  entry_id?: string | null;
  meta?: Record<string, unknown>;
};

export async function audit(ev: AuditInput): Promise<void> {
  try {
    await supabase.from("audit_log").insert({
      event: ev.event,
      ip: ev.ip ?? null,
      ua: ev.ua ? ev.ua.slice(0, 500) : null,
      entry_id: ev.entry_id ?? null,
      meta: ev.meta ?? null,
    });
  } catch {
    /* */
  }
}

export function clientInfo(req: Request): { ip: string; ua: string } {
  const h = req.headers;
  const xff = h.get("x-forwarded-for") ?? "";
  const ip = xff.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const ua = h.get("user-agent") ?? "unknown";
  return { ip, ua };
}
