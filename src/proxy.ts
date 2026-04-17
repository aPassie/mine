import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const IS_PROD = process.env.NODE_ENV === "production";
const COOKIE_NAME = IS_PROD ? "__Host-mine_session" : "mine_session";
const FALLBACK_COOKIE = "mine_session";
const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/cron"];

function secretKey() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET not set");
  return new TextEncoder().encode(s);
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  const token =
    req.cookies.get(COOKIE_NAME)?.value ?? req.cookies.get(FALLBACK_COOKIE)?.value;
  let authed = false;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secretKey());
      if (payload.sub === "owner") authed = true;
    } catch {
      authed = false;
    }
  }

  if (!authed) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon.*|.*\\..*).*)"],
};
