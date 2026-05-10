import { NextRequest, NextResponse } from "next/server";

/** Verify a session token using Web Crypto API (Edge Runtime compatible). */
async function isValidToken(token: string): Promise<boolean> {
    const secret = process.env.SESSION_SECRET ?? "fallback-secret";
    const dotIdx = token.lastIndexOf(".");
    if (dotIdx === -1) return false;
    const ts = token.slice(0, dotIdx);
    const hmac = token.slice(dotIdx + 1);
    if (!ts || !hmac) return false;

    try {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            "raw",
            encoder.encode(secret),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["verify"]
        );
        const hmacBytes = new Uint8Array(
            (hmac.match(/.{2}/g) ?? []).map((b) => parseInt(b, 16))
        );
        const valid = await crypto.subtle.verify(
            "HMAC",
            key,
            hmacBytes,
            encoder.encode(ts)
        );
        if (!valid) return false;

        // Check token age — max 8 hours
        const age = Date.now() - parseInt(ts, 10);
        if (isNaN(age) || age > 8 * 60 * 60 * 1000) return false;

        return true;
    } catch {
        return false;
    }
}

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Only protect /controlCenter routes (but not the login page itself)
    if (
        pathname.startsWith("/controlCenter") &&
        !pathname.startsWith("/controlCenter/login")
    ) {
        const token = req.cookies.get("admin_session")?.value ?? "";
        if (!(await isValidToken(token))) {
            const loginUrl = req.nextUrl.clone();
            loginUrl.pathname = "/controlCenter/login";
            return NextResponse.redirect(loginUrl);
        }
    }

    // Mark admin routes so the root layout can hide the site header/footer
    const res = NextResponse.next();
    if (pathname.startsWith("/controlCenter")) {
        res.headers.set("x-is-admin", "1");
    }
    return res;
}

export const config = {
    matcher: ["/controlCenter/:path*"],
};
