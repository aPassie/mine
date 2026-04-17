import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/guard";

export async function GET(req: Request) {
  const bad = await requireAuth();
  if (bad) return bad;

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 100), 500);
  const event = url.searchParams.get("event");

  let q = supabase
    .from("audit_log")
    .select("id, ts, event, ip, ua, entry_id, meta")
    .order("ts", { ascending: false })
    .limit(limit);

  if (event) q = q.eq("event", event);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ events: data ?? [] });
}
