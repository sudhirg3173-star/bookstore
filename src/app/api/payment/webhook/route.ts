import { NextRequest, NextResponse } from "next/server";
import { cashfreeConfig, verifyCashfreeSignature } from "@/lib/cashfree";
import { confirmPaymentOrder, getPaymentOrder } from "@/lib/paymentOrders";

export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text();
        if (!verifyCashfreeSignature(rawBody, req.headers.get("x-webhook-timestamp") || "",
            req.headers.get("x-webhook-signature") || "", cashfreeConfig().clientSecret)) {
            return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
        }
        const payload = JSON.parse(rawBody);
        if (!["PAYMENT_SUCCESS_WEBHOOK", "PAYMENT_FAILED_WEBHOOK", "PAYMENT_USER_DROPPED_WEBHOOK"].includes(payload.type)) {
            return NextResponse.json({ received: true });
        }
        const orderId = payload.data?.order?.order_id;
        if (typeof orderId !== "string" || !/^kb_[a-f0-9]{32}$/.test(orderId)) {
            return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
        }
        if (!await getPaymentOrder(orderId)) return NextResponse.json({ error: "Order not found" }, { status: 404 });
        await confirmPaymentOrder(orderId);
        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("Cashfree webhook processing failed:", error instanceof Error ? error.message : "Unknown error");
        return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
    }
}
