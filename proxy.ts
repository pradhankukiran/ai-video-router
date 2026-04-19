import { NextResponse, type NextRequest } from "next/server";

/**
 * API surface guard.
 *
 * This app is explicitly local, single-user (see README "Auth & ToS note").
 * The proxy enforces two things on /api/* traffic:
 *
 *   1. Host binding: reject requests that don't target localhost / 127.0.0.1.
 *      Catches the case where someone runs `next dev -H 0.0.0.0` and exposes
 *      the app to their LAN (which would also violate the ToS carve-out that
 *      keeps the user's Claude creds single-user).
 *
 *   2. CSRF for mutating methods (POST/DELETE/PUT/PATCH):
 *        - `Origin` must be http://localhost:3000 or http://127.0.0.1:3000.
 *        - A custom `x-avr: 1` header must be present. This forces a CORS
 *          preflight for any cross-origin caller, which in turn means a
 *          drive-by form submit or <img>/<script> from another origin cannot
 *          reach our handlers. UI fetches must add the header (contract for
 *          the UX layer).
 *
 * GET is intentionally left open so the file download endpoint works via a
 * plain navigation (<a href=... download>). GETs are expected to be safe.
 */

const ALLOWED_ORIGINS = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

const ALLOWED_HOSTS = new Set(["localhost", "127.0.0.1"]);

const MUTATING_METHODS = new Set(["POST", "DELETE", "PUT", "PATCH"]);

export function proxy(req: NextRequest): NextResponse {
  const hostname = req.nextUrl.hostname;
  if (!ALLOWED_HOSTS.has(hostname)) {
    return new NextResponse(
      JSON.stringify({
        error:
          "ai-video-router is single-user / local-only. Bind to localhost or 127.0.0.1 (see README ToS note).",
      }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    );
  }

  if (MUTATING_METHODS.has(req.method)) {
    const origin = req.headers.get("origin");
    if (!origin || !ALLOWED_ORIGINS.has(origin)) {
      return new NextResponse(
        JSON.stringify({ error: "Forbidden origin" }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }
    if (req.headers.get("x-avr") !== "1") {
      return new NextResponse(
        JSON.stringify({ error: "Missing x-avr header" }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
