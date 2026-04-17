import { NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { ENTRY_TYPES, type EntryType } from "@/lib/types";
import { requireAuth } from "@/lib/guard";
import { audit, clientInfo } from "@/lib/audit";

const UpdateBody = z.object({
  raw_text: z.string().min(1).max(5000).optional(),
  type: z.enum(ENTRY_TYPES as [EntryType, ...EntryType[]]).optional(),
  tags: z.array(z.string()).optional(),
  pinned: z.boolean().optional(),
  last_seen_at: z.string().optional(),
});

export async function PATCH(req: Request, ctx: RouteContext<"/api/entries/[id]">) {
  const bad = await requireAuth();
  if (bad) return bad;
  const { ip, ua } = clientInfo(req);

  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = UpdateBody.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const { data, error } = await supabase
    .from("entries")
    .update(parsed.data)
    .eq("id", id)
    .select("id, raw_text, summary, type, tags, entities, mood, pinned, created_at, last_seen_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const isShufflePing =
    Object.keys(parsed.data).length === 1 && "last_seen_at" in parsed.data;
  if (!isShufflePing) {
    await audit({
      event: "entry_update",
      ip,
      ua,
      entry_id: id,
      meta: { fields: Object.keys(parsed.data) },
    });
  }
  return NextResponse.json({ entry: data });
}

export async function DELETE(req: Request, ctx: RouteContext<"/api/entries/[id]">) {
  const bad = await requireAuth();
  if (bad) return bad;
  const { ip, ua } = clientInfo(req);

  const { id } = await ctx.params;
  const { error } = await supabase.from("entries").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await audit({ event: "entry_delete", ip, ua, entry_id: id });
  return NextResponse.json({ ok: true });
}
