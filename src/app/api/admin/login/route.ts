import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Sign a value with HMAC-SHA256, returning a hex string. */
async function sign(value: string): Promise<string> {
    const secret = process.env.SESSION_SECRET ?? "fallback-secret";
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
    return Array.from(new Uint8Array(sig))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => ({}));
    const password = body?.password ?? "";

    const expected = process.env.ADMIN_PASSWORD;
    if (!expected || password !== expected) {
        return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const ts = Date.now().toString();
    const token = `${ts}.${await sign(ts)}`;

    const res = NextResponse.json({ success: true });
    res.cookies.set("admin_session", token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        // 8 hours
        maxAge: 60 * 60 * 8,
        // secure in production only
        secure: process.env.NODE_ENV === "production",
    });
    return res;
}
