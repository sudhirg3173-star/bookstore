import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    const sessionCookie = req.cookies.get("admin_session")?.value ?? "";

    // Always clear the cookie — logout must be idempotent
    const res = NextResponse.json({ success: true });
    res.cookies.set("admin_session", "", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
        secure: process.env.NODE_ENV === "production",
    });

    // Best-effort server-side session revocation
    if (sessionCookie) {
        try {
            const { auth } = getFirebaseAdmin();
            const decoded = await auth.verifySessionCookie(sessionCookie);
            await auth.revokeRefreshTokens(decoded.sub);
        } catch {
            // Cookie was invalid or already expired — still cleared above
        }
    }

    return res;
}
