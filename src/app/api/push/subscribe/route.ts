import { NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/guard";
import { audit, clientInfo } from "@/lib/audit";

const Body = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export async function POST(req: Request) {
  const bad = await requireAuth();
  if (bad) return bad;
  const { ip, ua } = clientInfo(req);

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const { endpoint, keys } = parsed.data;

  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        ua: ua.slice(0, 500),
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await audit({ event: "login_success", ip, ua, meta: { push_subscribed: true } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const bad = await requireAuth();
  if (bad) return bad;

  const url = new URL(req.url);
  const endpoint = url.searchParams.get("endpoint");
  if (!endpoint) return NextResponse.json({ error: "missing endpoint" }, { status: 400 });

  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  return NextResponse.json({ ok: true });
}
