import { NextRequest, NextResponse } from "next/server";
import { CreatePaymentRequestBody } from "@/types/payment";

export async function POST(req: NextRequest) {
    try {
        const body: CreatePaymentRequestBody = await req.json();
        const { amount, purpose, buyerName, email, phone } = body;

        if (!amount || !purpose || !buyerName || !email) {
            return NextResponse.json(
                { error: "Missing required fields: amount, purpose, buyerName, email" },
                { status: 400 }
            );
        }

        const apiKey = process.env.INSTAMOJO_API_KEY;
        const authToken = process.env.INSTAMOJO_AUTH_TOKEN;
        const apiUrl = process.env.INSTAMOJO_API_URL || "https://test.instamojo.com/api/1.1";
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        if (!apiKey || !authToken) {
            console.error("Instamojo credentials not configured");
            return NextResponse.json(
                { error: "Payment gateway not configured" },
                { status: 500 }
            );
        }

        const formData = new URLSearchParams({
            amount: amount.toFixed(2),
            purpose,
            buyer_name: buyerName,
            email,
            redirect_url: `${baseUrl}/payment/success`,
            allow_repeated_payments: "false",
            send_email: "false",
            send_sms: "false",
        });

        // Only register webhook on publicly reachable URLs (not localhost)
        const isLocalhost = baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1");
        if (!isLocalhost) {
            formData.append("webhook", `${baseUrl}/api/payment/webhook`);
        }

        // Phone is optional but Instamojo validates format if provided
        if (phone && /^[6-9]\d{9}$/.test(phone)) {
            formData.append("phone", phone);
        }

        const response = await fetch(`${apiUrl}/payment-requests/`, {
            method: "POST",
            headers: {
                "X-Api-Key": apiKey,
                "X-Auth-Token": authToken,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: formData.toString(),
        });

        const rawText = await response.text();
        let data: Record<string, unknown>;
        try {
            data = JSON.parse(rawText);
        } catch {
            console.error("Instamojo non-JSON response:", response.status, rawText.slice(0, 500));
            return NextResponse.json(
                { error: `Instamojo returned unexpected response (HTTP ${response.status}). Check API credentials and API URL.` },
                { status: 502 }
            );
        }

        if (!response.ok || !data.success) {
            console.error("Instamojo error:", data);
            const rawMsg = data.message || data.error;
            const msg =
                typeof rawMsg === "string"
                    ? rawMsg
                    : typeof rawMsg === "object" && rawMsg !== null
                        ? Object.entries(rawMsg as Record<string, string[]>)
                            .map(([field, errs]) => `${field}: ${errs.join(", ")}`)
                            .join(" | ")
                        : JSON.stringify(data);
            return NextResponse.json(
                { error: msg || "Failed to create payment request" },
                { status: 400 }
            );
        }

        return NextResponse.json({
            paymentUrl: (data.payment_request as Record<string, string>).longurl,
            requestId: (data.payment_request as Record<string, string>).id,
        });
    } catch (error) {
        console.error("Payment request error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
