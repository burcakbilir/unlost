import { type NextRequest, NextResponse } from "next/server";
import { sessionCookieName, verifySessionToken } from "./lib/session";

//Runs only for /dashboard (see matcher below). Verify the token, not just that
// a cookie exists, so an expired session is sent to sign in before the
//dashboard ever renders.
export function proxy(request: NextRequest) {
  const session = verifySessionToken(
    request.cookies.get(sessionCookieName)?.value,
  );

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(sessionCookieName);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
