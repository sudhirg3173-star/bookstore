import { createHmac, timingSafeEqual } from "node:crypto";

export interface CashfreeOrder {
    order_id: string;
    order_amount: number;
    order_currency: string;
    order_status: string;
    payment_session_id?: string;
}

export function cashfreeConfig() {
    const mode = process.env.CASHFREE_ENV || "sandbox";
    if (mode !== "sandbox" && mode !== "production") {
        throw new Error("CASHFREE_ENV must be sandbox or production");
    }
    const clientId = process.env.CASHFREE_CLIENT_ID;
    const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
    if (!clientId || !clientSecret) throw new Error("Cashfree credentials are not configured");
    return {
        mode,
        clientId,
        clientSecret,
        apiUrl: mode === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg",
    } as const;
}

export async function cashfreeRequest<T>(path: string, body?: unknown): Promise<T> {
    const config = cashfreeConfig();
    const response = await fetch(`${config.apiUrl}${path}`, {
        method: body ? "POST" : "GET",
        headers: {
            "x-client-id": config.clientId,
            "x-client-secret": config.clientSecret,
            "x-api-version": "2025-01-01",
            "Content-Type": "application/json",
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`Cashfree request failed (HTTP ${response.status})`);
    return response.json() as Promise<T>;
}

export function verifyCashfreeSignature(rawBody: string, timestamp: string, signature: string, secret: string): boolean {
    if (!timestamp || !signature) return false;
    const expected = createHmac("sha256", secret).update(timestamp + rawBody).digest();
    const received = Buffer.from(signature, "base64");
    return expected.length === received.length && timingSafeEqual(expected, received);
}

export function cashfreeOrderStatus(status: string): "Credit" | "Failed" | "Pending" {
    if (status === "PAID") return "Credit";
    if (status === "EXPIRED" || status === "TERMINATED") return "Failed";
    return "Pending";
}