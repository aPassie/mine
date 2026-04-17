import { NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { enrich } from "@/lib/groq";
import { embed } from "@/lib/embed";
import { ENTRY_TYPES, type EntryType } from "@/lib/types";
import { requireAuth } from "@/lib/guard";
import { audit, clientInfo } from "@/lib/audit";

const CreateBody = z.object({
  raw_text: z.string().min(1).max(5000),
  type: z.enum(ENTRY_TYPES as [EntryType, ...EntryType[]]).optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(req: Request) {
  const bad = await requireAuth();
  if (bad) return bad;
  const { ip, ua } = clientInfo(req);

  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const tag = url.searchParams.get("tag");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 200);

  let q = supabase
    .from("entries")
    .select("id, raw_text, summary, type, tags, entities, mood, pinned, created_at, last_seen_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (type) q = q.eq("type", type);
  if (tag) q = q.contains("tags", [tag]);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await audit({
    event: "entry_read_list",
    ip,
    ua,
    meta: { type, tag, count: (data ?? []).length },
  });
  return NextResponse.json({ entries: data ?? [] });
}

export async function POST(req: Request) {
  const bad = await requireAuth();
  if (bad) return bad;
  const { ip, ua } = clientInfo(req);

  const json = await req.json().catch(() => null);
  const parsed = CreateBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const raw_text = parsed.data.raw_text.trim();

  const { data: inserted, error: insertErr } = await supabase
    .from("entries")
    .insert({
      raw_text,
      type: parsed.data.type ?? "note",
      tags: parsed.data.tags ?? [],
    })
    .select("id, raw_text, summary, type, tags, entities, mood, pinned, created_at, last_seen_at")
    .single();

  if (insertErr || !inserted) {
    return NextResponse.json({ error: insertErr?.message ?? "insert failed" }, { status: 500 });
  }

  try {
    const [enrichment, vec] = await Promise.all([enrich(raw_text), embed(raw_text)]);
    const mergedTags = Array.from(
      new Set([...(parsed.data.tags ?? []), ...enrichment.tags].map((t) => t.toLowerCase())),
    ).slice(0, 8);

    const { data: updated } = await supabase
      .from("entries")
      .update({
        summary: enrichment.summary,
        type: parsed.data.type ?? enrichment.type,
        tags: mergedTags,
        entities: enrichment.entities,
        mood: enrichment.mood,
        embedding: vec,
      })
      .eq("id", inserted.id)
      .select(
        "id, raw_text, summary, type, tags, entities, mood, pinned, created_at, last_seen_at",
      )
      .single();

    await audit({ event: "entry_create", ip, ua, entry_id: inserted.id });
    return NextResponse.json({ entry: updated ?? inserted });
  } catch {
    await audit({ event: "entry_create", ip, ua, entry_id: inserted.id, meta: { enriched: false } });
    return NextResponse.json({ entry: inserted });
  }
}
