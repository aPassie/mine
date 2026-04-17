import { NextResponse } from "next/server";
import { z } from "zod";
import { checkPasscode, createSession } from "@/lib/auth";
import { audit, clientInfo } from "@/lib/audit";
import { checkLoginRate, recordLoginAttempt, formatRetryAfter } from "@/lib/rate-limit";

const Body = z.object({ passcode: z.string().min(1).max(200) });

export async function POST(req: Request) {
  const { ip, ua } = clientInfo(req);

  const rate = await checkLoginRate(ip);
  if (!rate.allowed) {
    await audit({ event: "login_lockout", ip, ua, meta: { retryAfterMs: rate.retryAfterMs } });
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${formatRetryAfter(rate.retryAfterMs)}.` },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rate.retryAfterMs / 1000)) },
      },
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    await recordLoginAttempt(ip, false);
    await audit({ event: "login_fail", ip, ua, meta: { reason: "invalid_body" } });
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const ok = checkPasscode(parsed.data.passcode);
  await recordLoginAttempt(ip, ok);

  if (!ok) {
    await audit({ event: "login_fail", ip, ua });
    return NextResponse.json({ error: "wrong passcode" }, { status: 401 });
  }

  await createSession();
  await audit({ event: "login_success", ip, ua });
  return NextResponse.json({ ok: true });
}
