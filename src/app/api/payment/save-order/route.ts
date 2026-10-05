import { NextResponse } from "next/server";

export async function POST() {
    return NextResponse.json({ error: "Orders are saved and verified server-side during checkout" }, { status: 410 });
}
