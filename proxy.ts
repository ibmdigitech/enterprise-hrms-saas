import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

/** Reachable without a session. */
const PUBLIC_PATHS = new Set(["/", "/login"]);

const NEVER_REDIRECT_PATHS = new Set(["/api/health"]);

function isPublicPath(pathname: string): boolean {
    return PUBLIC_PATHS.has(pathname) || pathname.startsWith("/activate/");
}

const { auth } = NextAuth(authConfig);

export default auth((req) => {
    const { pathname } = req.nextUrl;
    const session = req.auth;

    if (NEVER_REDIRECT_PATHS.has(pathname)) {
        const res = NextResponse.next();
        res.headers.set("x-pathname", pathname);
        return res;
    }

    if (isPublicPath(pathname)) {
        if (session?.user) {
            const role = (session.user as { role?: string })?.role;
            const dest = role === "SUPER_ADMIN" ? "/super-admin/dashboard" : "/dashboard";
            return NextResponse.redirect(new URL(dest, req.nextUrl));
        }
        const res = NextResponse.next();
        res.headers.set("x-pathname", pathname);
        return res;
    }

    if (!session?.user) {
        if (pathname.startsWith("/api/")) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }
        const loginUrl = new URL("/login", req.nextUrl);
        if (pathname !== "/") loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Multi-tenant resolution at the edge:
    const host = req.headers.get("host") || "";
    const hostname = host.split(":")[0];
    let tenantSlug = "";
    
    const hostParts = hostname.split(".");
    if (hostParts.length > 2 && !hostname.endsWith("localhost") && !hostname.endsWith("vercel.app")) {
        tenantSlug = hostParts[0];
    } else if (req.headers.has("x-tenant-slug")) {
        tenantSlug = req.headers.get("x-tenant-slug") || "";
    }

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-pathname", pathname);
    if (tenantSlug) {
        requestHeaders.set("x-resolved-tenant-slug", tenantSlug);
    }
    const tenantIdHeader = req.headers.get("x-tenant-id");
    if (tenantIdHeader) {
        requestHeaders.set("x-resolved-tenant-id", tenantIdHeader);
    }

    const response = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
    response.headers.set("x-pathname", pathname);
    return response;
});

export const config = {
    matcher: [
        "/((?!api/auth|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
    ],
};
