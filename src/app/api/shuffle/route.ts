import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { Entry } from "@/lib/types";
import { requireAuth } from "@/lib/guard";
import { audit, clientInfo } from "@/lib/audit";

export async function GET(req: Request) {
  const bad = await requireAuth();
  if (bad) return bad;
  const { ip, ua } = clientInfo(req);

  const { data, error } = await supabase
    .from("entries")
    .select("id, raw_text, summary, type, tags, entities, mood, pinned, created_at, last_seen_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const all = (data ?? []) as Entry[];
  if (all.length === 0) return NextResponse.json({ entries: [] });

  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  const recent = all.filter((e) => now - new Date(e.created_at).getTime() < 30 * DAY);
  const forgotten = all.filter((e) => {
    const last = e.last_seen_at ?? e.created_at;
    return now - new Date(last).getTime() > 60 * DAY;
  });
  const pinned = all.filter((e) => e.pinned);

  const picks: Entry[] = [];
  const seen = new Set<string>();
  const take = (arr: Entry[], count: number) => {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    for (const e of shuffled) {
      if (picks.length >= 20) break;
      if (seen.has(e.id)) continue;
      if (count-- <= 0) break;
      picks.push(e);
      seen.add(e.id);
    }
  };

  take(recent, 8);
  take(forgotten, 6);
  take(pinned, 4);
  take(all, 2);

  while (picks.length < Math.min(20, all.length)) {
    const e = all[Math.floor(Math.random() * all.length)];
    if (!seen.has(e.id)) {
      picks.push(e);
      seen.add(e.id);
    }
  }

  await audit({ event: "entry_read_shuffle", ip, ua, meta: { count: picks.length } });
  return NextResponse.json({ entries: picks });
}
