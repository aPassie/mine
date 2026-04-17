import { NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/guard";
import { audit, clientInfo } from "@/lib/audit";

const CreateBody = z.object({
  entry_id: z.string().uuid(),
  fire_at: z.string().datetime(),
  title: z.string().max(120).optional(),
  body: z.string().max(500).optional(),
});

export async function GET(req: Request) {
  const bad = await requireAuth();
  if (bad) return bad;

  const url = new URL(req.url);
  const entry_id = url.searchParams.get("entry_id");
  let q = supabase
    .from("reminders")
    .select("id, entry_id, kind, title, body, fire_at, sent_at, cancelled_at, created_at")
    .is("cancelled_at", null)
    .is("sent_at", null)
    .order("fire_at", { ascending: true });
  if (entry_id) q = q.eq("entry_id", entry_id);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reminders: data ?? [] });
}

export async function POST(req: Request) {
  const bad = await requireAuth();
  if (bad) return bad;
  const { ip, ua } = clientInfo(req);

  const json = await req.json().catch(() => null);
  const parsed = CreateBody.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const { data, error } = await supabase
    .from("reminders")
    .insert({
      entry_id: parsed.data.entry_id,
      kind: "manual",
      title: parsed.data.title ?? null,
      body: parsed.data.body ?? null,
      fire_at: parsed.data.fire_at,
    })
    .select("id, entry_id, kind, title, body, fire_at, sent_at, cancelled_at, created_at")
    .single();

  if (error || !data) return NextResponse.json({ error: error?.message ?? "failed" }, { status: 500 });

  await audit({
    event: "entry_update",
    ip,
    ua,
    entry_id: parsed.data.entry_id,
    meta: { reminder_created: true, fire_at: parsed.data.fire_at },
  });
  return NextResponse.json({ reminder: data });
}
