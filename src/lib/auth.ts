import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { supabase } from "./supabase";
import { assertPasscodeOk } from "./passcode";

const IS_PROD = process.env.NODE_ENV === "production";
const COOKIE_NAME = IS_PROD ? "__Host-mine_session" : "mine_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function secretKey() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    throw new Error("AUTH_SECRET must be set (>= 32 chars)");
  }
  return new TextEncoder().encode(s);
}

type SessionClaims = {
  sub: string;
  sv: number;
};

async function getCurrentSessionVersion(): Promise<number> {
  const { data } = await supabase
    .from("session_state")
    .select("version")
    .eq("id", 1)
    .single();
  return data?.version ?? 1;
}

export async function bumpSessionVersion(): Promise<number> {
  const current = await getCurrentSessionVersion();
  const next = current + 1;
  await supabase
    .from("session_state")
    .update({ version: next, updated_at: new Date().toISOString() })
    .eq("id", 1);
  return next;
}

export async function createSession() {
  const sv = await getCurrentSessionVersion();
  const token = await new SignJWT({ sub: "owner", sv })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey());

  const c = await cookies();
  c.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function clearSession() {
  const c = await cookies();
  c.delete(COOKIE_NAME);
}

export async function getSessionToken(): Promise<string | null> {
  const c = await cookies();
  return c.get(COOKIE_NAME)?.value ?? null;
}

export async function verifyToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify<SessionClaims>(token, secretKey());
    if (payload.sub !== "owner") return false;
    const currentSv = await getCurrentSessionVersion();
    if (payload.sv !== currentSv) return false;
    return true;
  } catch {
    return false;
  }
}

export async function isAuthed(): Promise<boolean> {
  const token = await getSessionToken();
  return verifyToken(token);
}

export function checkPasscode(input: string): boolean {
  assertPasscodeOk();
  const expected = process.env.APP_PASSCODE ?? "";
  if (!expected) return false;
  if (input.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ input.charCodeAt(i);
  }
  return diff === 0;
}

export const SESSION_COOKIE = COOKIE_NAME;
