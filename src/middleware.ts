import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isRootHostname, isTenantBypassHostname, stripPort } from "@/lib/tenant/hostname";

/**
 * Apex domenni (subdomainsiz `crm.uz`/`localhost`) superadmin sirtiga
 * yo'naltiradi. Boshqa hamma narsa — real maktab subdomenlari
 * (elegantschool.crm.uz) va `admin.*` — o'zgarishsiz o'tadi; ular login
 * sahifasining o'zida (client-side) hostname bo'yicha aniqlanadi.
 */
export function middleware(request: NextRequest) {
  const hostname = stripPort(request.headers.get("host") ?? "");

  if (isTenantBypassHostname(hostname) || !isRootHostname(hostname)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.hostname = `admin.${hostname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
