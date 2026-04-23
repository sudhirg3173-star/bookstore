import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { InstamojoWebhookPayload } from "@/types/payment";

/**
 * Verifies the webhook MAC signature from Instamojo.
 * Salt is your Instamojo auth token. Instamojo computes:
 * HMAC-SHA1(salt, "|".join(sorted fields except mac)) and compares to mac field.
 */
function verifyWebhookMac(payload: InstamojoWebhookPayload, salt: string): boolean {
    const { mac, ...rest } = payload;

    // Sort fields alphabetically and join with "|"
    const message = Object.keys(rest)
        .sort()
        .map((key) => (rest as Record<string, string>)[key] ?? "")
        .join("|");

    const expectedMac = crypto
        .createHmac("sha1", salt)
        .update(message)
        .digest("hex");

    return expectedMac === mac;
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const payload: InstamojoWebhookPayload = {
            payment_id: formData.get("payment_id") as string,
            payment_request_id: formData.get("payment_request_id") as string,
            buyer: formData.get("buyer") as string,
            buyer_name: formData.get("buyer_name") as string,
            buyer_phone: formData.get("buyer_phone") as string,
            currency: formData.get("currency") as string,
            amount: formData.get("amount") as string,
            fees: formData.get("fees") as string,
            purpose: formData.get("purpose") as string,
            status: formData.get("status") as "Credit" | "Failed",
            longurl: formData.get("longurl") as string,
            mac: formData.get("mac") as string,
            shipped_at: (formData.get("shipped_at") as string) || undefined,
            created_at: formData.get("created_at") as string,
        };

        const authToken = process.env.INSTAMOJO_AUTH_TOKEN;
        if (!authToken) {
            return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
        }

        if (!verifyWebhookMac(payload, authToken)) {
            console.warn("Instamojo webhook: MAC verification failed", payload.payment_id);
            return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
        }

        if (payload.status === "Credit") {
            // Payment succeeded — update your database / fulfill order here
            console.log(
                `Payment successful: id=${payload.payment_id} request=${payload.payment_request_id} amount=${payload.amount}`
            );
            // TODO: persist order to DB
        } else {
            console.log(
                `Payment failed: id=${payload.payment_id} status=${payload.status}`
            );
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("Webhook error:", error);
        return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
    }
}
