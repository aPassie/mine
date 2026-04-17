import { NextResponse } from "next/server";
import { isAuthed } from "./auth";

export async function requireAuth(): Promise<NextResponse | null> {
  const ok = await isAuthed();
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return null;
}
