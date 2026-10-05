import { NextRequest, NextResponse } from "next/server";
import { confirmPaymentOrder, getPaymentOrder } from "@/lib/paymentOrders";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const orderId = req.nextUrl.searchParams.get("order_id") || "";
    if (!/^kb_[a-f0-9]{32}$/.test(orderId)) return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    try {
        if (!await getPaymentOrder(orderId)) return NextResponse.json({ error: "Order not found" }, { status: 404 });
        const status = await confirmPaymentOrder(orderId);
        return NextResponse.json({ orderId, status }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
        console.error("Payment verification failed:", error instanceof Error ? error.message : "Unknown error");
        return NextResponse.json({ error: "Unable to verify payment. Please try again." }, { status: 502 });
    }
}