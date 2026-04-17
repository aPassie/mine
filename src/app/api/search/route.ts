import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { embed } from "@/lib/embed";
import { requireAuth } from "@/lib/guard";
import { audit, clientInfo } from "@/lib/audit";

export async function GET(req: Request) {
  const bad = await requireAuth();
  if (bad) return bad;
  const { ip, ua } = clientInfo(req);

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 500);
  if (!q) return NextResponse.json({ entries: [] });

  const vec = await embed(q);
  const { data, error } = await supabase.rpc("match_entries", {
    query_embedding: vec,
    match_threshold: 0.0,
    match_count: 30,
  });

  let entries = data ?? [];
  if (error) {
    const { data: kw } = await supabase
      .from("entries")
      .select(
        "id, raw_text, summary, type, tags, entities, mood, pinned, created_at, last_seen_at",
      )
      .ilike("raw_text", `%${q}%`)
      .limit(30);
    entries = kw ?? [];
  }

  await audit({
    event: "entry_read_search",
    ip,
    ua,
    meta: { query_len: q.length, results: entries.length },
  });
  return NextResponse.json({ entries });
}
