import { NextResponse } from "next/server";
import { bumpSessionVersion, clearSession } from "@/lib/auth";
import { audit, clientInfo } from "@/lib/audit";

export async function POST(req: Request) {
  const { ip, ua } = clientInfo(req);
  const newVersion = await bumpSessionVersion();
  await clearSession();
  await audit({ event: "logout_all", ip, ua, meta: { newVersion } });
  return NextResponse.json({ ok: true });
}
