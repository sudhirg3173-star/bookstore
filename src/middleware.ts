import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

function getSigningKey(): Uint8Array {
    const email = process.env.ADMIN_EMAIL ?? "";
    const password = process.env.ADMIN_PASSWORD ?? "";
    return new TextEncoder().encode(`${email}:${password}`);
}

/** Verify the admin session JWT (HS256, signed with ADMIN_EMAIL:ADMIN_PASSWORD). */
async function isValidSessionCookie(token: string): Promise<boolean> {
    if (!token) return false;
    try {
        await jwtVerify(token, getSigningKey());
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
        if (!(await isValidSessionCookie(token))) {
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
