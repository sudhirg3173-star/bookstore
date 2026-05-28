import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

export const dynamic = "force-dynamic";

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

function getSigningKey(): Uint8Array {
    const email = process.env.ADMIN_EMAIL ?? "";
    const password = process.env.ADMIN_PASSWORD ?? "";
    return new TextEncoder().encode(`${email}:${password}`);
}

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => ({}));
    const email: string = body?.email ?? "";
    const password: string = body?.password ?? "";

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
        return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    if (email !== adminEmail || password !== adminPassword) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    try {
        const token = await new SignJWT({ email })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("8h")
            .sign(getSigningKey());

        const res = NextResponse.json({ success: true });
        res.cookies.set("admin_session", token, {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            maxAge: SESSION_DURATION_MS / 1000,
            secure: process.env.NODE_ENV === "production",
        });
        return res;
    } catch {
        return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }
}
