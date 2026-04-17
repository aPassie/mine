import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendPushToAll } from "@/lib/push";
import type { Entry } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = {
    manual_sent: 0,
    manual_failed: 0,
    smart_sent: 0,
    smart_skipped: "",
  };

  const nowIso = new Date().toISOString();
  const { data: due } = await supabase
    .from("reminders")
    .select("id, entry_id, title, body")
    .is("sent_at", null)
    .is("cancelled_at", null)
    .lte("fire_at", nowIso)
    .limit(50);

  if (due && due.length > 0) {
    for (const r of due) {
      const res = await sendPushToAll({
        title: r.title || "Remember this?",
        body: r.body || "",
        url: "/",
        tag: `reminder-${r.id}`,
        entryId: r.entry_id ?? undefined,
      });
      await supabase
        .from("reminders")
        .update({ sent_at: new Date().toISOString() })
        .eq("id", r.id);
      result.manual_sent += res.sent;
      result.manual_failed += res.failed;
    }
  }

  const everyDays = parseInt(process.env.SMART_MOTIVATING_EVERY_DAYS ?? "4", 10);
  const fireHour = parseInt(process.env.SMART_MOTIVATING_HOUR_UTC ?? "", 10);

  if (Number.isNaN(fireHour) || fireHour < 0 || fireHour > 23) {
    result.smart_skipped = "not_configured";
  } else {
    const now = new Date();
    const inWindow =
      now.getUTCHours() === fireHour && now.getUTCMinutes() < 10;
    if (inWindow) {
      const cutoff = new Date(
        now.getTime() - everyDays * 24 * 60 * 60 * 1000 + 60 * 60 * 1000,
      ).toISOString();
      const { data: lastRows } = await supabase
        .from("reminders")
        .select("created_at")
        .eq("kind", "smart")
        .order("created_at", { ascending: false })
        .limit(1);
      const last = lastRows?.[0]?.created_at;
      const dueForSmart = !last || new Date(last).toISOString() < cutoff;

      if (!dueForSmart) {
        result.smart_skipped = `next in ~${everyDays}d`;
      } else {
        const picked = await pickMotivating();
        if (picked) {
          const res = await sendPushToAll({
            title: "From your past self",
            body: picked.body,
            url: "/",
            tag: "smart-motivating",
            entryId: picked.entry_id,
          });
          await supabase.from("reminders").insert({
            entry_id: picked.entry_id,
            kind: "smart",
            title: "From your past self",
            body: picked.body,
            fire_at: now.toISOString(),
            sent_at: now.toISOString(),
          });
          result.smart_sent = res.sent;
        } else {
          result.smart_skipped = "no_candidate";
        }
      }
    }
  }

  return NextResponse.json({ ok: true, ...result });
}

async function pickMotivating(): Promise<{ entry_id: string; body: string } | null> {
  const { data: recentSmart } = await supabase
    .from("reminders")
    .select("entry_id")
    .eq("kind", "smart")
    .gte("created_at", new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString());
  const skip = new Set<string>((recentSmart ?? []).map((r) => r.entry_id).filter(Boolean));

  {
    const { data } = await supabase
      .from("entries")
      .select("id, raw_text, summary")
      .eq("mood", "motivating")
      .limit(50);
    const candidates = ((data ?? []) as Pick<Entry, "id" | "raw_text" | "summary">[])
      .filter((e) => !skip.has(e.id));
    if (candidates.length) {
      const e = candidates[Math.floor(Math.random() * candidates.length)];
      return { entry_id: e.id, body: excerpt(e.summary || e.raw_text) };
    }
  }

  {
    const { data } = await supabase
      .from("entries")
      .select("id, raw_text, summary")
      .eq("pinned", true)
      .limit(50);
    const candidates = ((data ?? []) as Pick<Entry, "id" | "raw_text" | "summary">[])
      .filter((e) => !skip.has(e.id));
    if (candidates.length) {
      const e = candidates[Math.floor(Math.random() * candidates.length)];
      return { entry_id: e.id, body: excerpt(e.summary || e.raw_text) };
    }
  }

  {
    const { data } = await supabase
      .from("entries")
      .select("id, raw_text, summary")
      .order("created_at", { ascending: true })
      .limit(100);
    const candidates = ((data ?? []) as Pick<Entry, "id" | "raw_text" | "summary">[])
      .filter((e) => !skip.has(e.id));
    if (candidates.length) {
      const sample = candidates.sort(() => Math.random() - 0.5).slice(0, 5);
      const e = sample.reduce((best, cur) =>
        (cur.raw_text?.length ?? 0) > (best.raw_text?.length ?? 0) ? cur : best,
      );
      return { entry_id: e.id, body: excerpt(e.summary || e.raw_text) };
    }
  }

  return null;
}

function excerpt(s: string | null): string {
  if (!s) return "";
  return s.length > 120 ? s.slice(0, 117) + "…" : s;
}
