import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";
import { audit, clientInfo } from "@/lib/audit";

export async function POST(req: Request) {
  const { ip, ua } = clientInfo(req);
  await clearSession();
  await audit({ event: "logout", ip, ua });
  return NextResponse.json({ ok: true });
}
