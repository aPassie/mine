import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/guard";

export async function DELETE(_req: Request, ctx: RouteContext<"/api/reminders/[id]">) {
  const bad = await requireAuth();
  if (bad) return bad;

  const { id } = await ctx.params;
  const { error } = await supabase
    .from("reminders")
    .update({ cancelled_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
