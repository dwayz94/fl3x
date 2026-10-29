import { NextResponse, type NextRequest } from "next/server";
import { site } from "@/config/site";

/**
 * Profile analytics beacon. Runs on Vercel so it can read the visitor's
 * IP and country, then forwards to the API with the internal key.
 */
// The dev default only exists locally; production must share the API's real key.
const internalKey = process.env.INTERNAL_API_KEY ?? (process.env.NODE_ENV === "production" ? "" : "dev-internal-key");
const USERNAME = /^[a-z0-9_]{2,32}$/i;

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { username?: string; kind?: string; target?: string; referrer?: string } | null;
  if (!body?.username || !USERNAME.test(body.username) || (body.kind !== "view" && body.kind !== "click")) return NextResponse.json({ ok: false }, { status: 400 });
  if (!internalKey) return NextResponse.json({ ok: false }, { status: 503 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
  const country = req.headers.get("x-vercel-ip-country") ?? undefined;

  await fetch(`${site.apiUrl}/internal/track`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-internal-key": internalKey },
    body: JSON.stringify({
      username: body.username,
      kind: body.kind,
      target: body.target?.slice(0, 64),
      ip,
      userAgent: req.headers.get("user-agent") ?? "",
      country: country && country.length === 2 ? country : undefined,
      referrer: body.referrer?.slice(0, 500) || undefined,
    }),
  }).catch(() => null);

  return NextResponse.json({ ok: true });
}
