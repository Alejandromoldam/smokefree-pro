import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CANONICAL_HOST = "allinonestore.lat";
const WWW_HOST = `www.${CANONICAL_HOST}`;

export function middleware(request: NextRequest) {
  const hostHeader = request.headers.get("host") || "";
  const forwardedHostHeader = request.headers.get("x-forwarded-host") || "";
  const host = hostHeader.split(":")[0].toLowerCase();
  const forwardedHost = forwardedHostHeader.split(",")[0].trim().split(":")[0].toLowerCase();

  if (host === WWW_HOST || forwardedHost === WWW_HOST) {
    const redirectUrl = new URL(request.url);
    redirectUrl.protocol = "https:";
    redirectUrl.host = CANONICAL_HOST;
    return NextResponse.redirect(redirectUrl, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};
