import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function POST() {
    const res = NextResponse.json({ success: true });
    res.cookies.set("admin_session", "", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
    });
    return res;
}
