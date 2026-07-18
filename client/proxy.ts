import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Routes that require an authenticated session.
const PROTECTED_PREFIXES = ["/dashboard", "/board", "/calendar"];
// Auth routes that a signed-in user shouldn't see.
const AUTH_ROUTES = ["/login", "/signup"];

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Optimistic cookie presence check (real verification happens in server actions).
    const sessionCookie = getSessionCookie(request);

    const isProtected = PROTECTED_PREFIXES.some(
        (p) => pathname === p || pathname.startsWith(`${p}/`)
    );
    const isAuthRoute = AUTH_ROUTES.includes(pathname);

    if (isProtected && !sessionCookie) {
        const url = new URL("/login", request.url);
        return NextResponse.redirect(url);
    }

    if (isAuthRoute && sessionCookie) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/board/:path*", "/calendar/:path*", "/login", "/signup"],
};
