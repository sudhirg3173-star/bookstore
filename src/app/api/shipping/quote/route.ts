import { NextRequest, NextResponse } from "next/server";
import { getShippingQuote, ShippingError } from "@/lib/shipglobal";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid shipping request" }, { status: 400 });
        const quote = await getShippingQuote(body.items, body.countryCode, body.postcode);
        return NextResponse.json(quote, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
        if (error instanceof ShippingError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        return NextResponse.json({ error: "Invalid shipping request" }, { status: 400 });
    }
}