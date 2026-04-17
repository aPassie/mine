import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { sendPushToAll } from "@/lib/push";

export async function POST() {
  const bad = await requireAuth();
  if (bad) return bad;

  const result = await sendPushToAll({
    title: "Mine",
    body: "Notifications are working. You're all set.",
    url: "/",
  });

  return NextResponse.json(result);
}
