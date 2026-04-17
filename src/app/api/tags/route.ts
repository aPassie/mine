import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/guard";
import { audit, clientInfo } from "@/lib/audit";

export async function GET(req: Request) {
  const bad = await requireAuth();
  if (bad) return bad;
  const { ip, ua } = clientInfo(req);

  const { data, error } = await supabase.from("entries").select("tags");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const tags = (row.tags ?? []) as string[];
    for (const t of tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  const tags = Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  await audit({ event: "tags_read", ip, ua, meta: { count: tags.length } });
  return NextResponse.json({ tags });
}
