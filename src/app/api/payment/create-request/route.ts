import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { CreatePaymentRequestBody } from "@/types/payment";
import { OrderItem } from "@/types/order";
import { cashfreeConfig, cashfreeRequest, CashfreeOrder } from "@/lib/cashfree";
import { savePendingOrder } from "@/lib/paymentOrders";
import { getBookBySku } from "@/lib/books";
import { getStandardBySlug } from "@/lib/standards";
import { standardToBook } from "@/lib/standardUtils";
import { GET as getExchangeRates } from "@/app/api/exchange-rates/route";
import { getFirebaseAdmin } from "@/lib/firebaseAdmin";
import { getShippingQuote, ShippingError } from "@/lib/shipglobal";
import { isDigitalSku, validCountry, validPhone, validPostcode } from "@/lib/shippingRules";
import { OrderShipping } from "@/types/shipping";

export async function POST(req: NextRequest) {
    try {
        const body: CreatePaymentRequestBody = await req.json();
        const { buyerName, email, phone, billing, billingAddress } = body;
        const countryCode = billing?.countryCode ?? "IN";
        if (typeof buyerName !== "string" || !buyerName.trim() || typeof email !== "string" ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof phone !== "string" ||
            !validCountry(countryCode) || !validPhone(phone, countryCode) ||
            typeof billing?.address !== "string" || !billing.address.trim() || typeof billing.state !== "string" || !billing.state.trim() ||
            !validPostcode(billing.pincode, countryCode) || !Array.isArray(body.items) ||
            body.items.length === 0 || body.items.length > 100) {
            return NextResponse.json({ error: "Valid customer, delivery address and cart items are required" }, { status: 400 });
        }
        if (billingAddress && (typeof billingAddress.address !== "string" || !billingAddress.address.trim() ||
            typeof billingAddress.state !== "string" || !billingAddress.state.trim() ||
            !validCountry(billingAddress.countryCode ?? "IN") || !validPostcode(billingAddress.pincode, billingAddress.countryCode ?? "IN"))) {
            return NextResponse.json({ error: "Invalid billing address" }, { status: 400 });
        }
        const items: OrderItem[] = [];
        for (const item of body.items) {
            const sku = item?.book?.sku;
            if (typeof sku !== "string" || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) {
                return NextResponse.json({ error: "Invalid cart item" }, { status: 400 });
            }
            let book = getBookBySku(sku);
            if (!book && sku.startsWith("std-")) {
                const standard = getStandardBySlug(sku.slice(4));
                const pdfStandard = !standard && sku.endsWith("-pdf") ? getStandardBySlug(sku.slice(4, -4)) : undefined;
                if (standard) book = standardToBook(standard);
                else if (pdfStandard?.pdfPrice) book = standardToBook(pdfStandard, "pdf");
            }
            if (!book || !book.visible || book.availability !== "In Stock" || book.price <= 0) {
                return NextResponse.json({ error: "A cart item is no longer available. Please refresh your cart." }, { status: 400 });
            }
            items.push({
                sku: book.sku, title: book.title, authors: book.authors, quantity: item.quantity,
                price: book.price, currency: book.currency, imageUrl: book.imageUrl,
                ...(book.discount ? { discount: book.discount } : {}),
            });
        }
        const rates: Record<string, number> = items.some((item) => item.currency.toUpperCase() !== "INR")
            ? (await (await getExchangeRates()).json()).rates : { INR: 1 };
        const subtotal = items.reduce((total, item) => {
            const rate = rates[item.currency.toUpperCase()];
            if (!Number.isFinite(rate) || rate <= 0) throw new Error("Currency conversion is unavailable");
            return total + item.price * (1 - (item.discount || 0) / 100) * item.quantity / rate;
        }, 0);
        let shipping: OrderShipping | undefined;
        if (countryCode !== "IN" && items.some((item) => !isDigitalSku(item.sku))) {
            if (typeof body.shippingService !== "string" || !body.shippingService) {
                return NextResponse.json({ error: "Select an international shipping service before paying" }, { status: 400 });
            }
            const quote = await getShippingQuote(items, countryCode, billing.pincode);
            const service = quote.services.find((candidate) => candidate.title === body.shippingService);
            if (!service) return NextResponse.json({ error: "Shipping service is no longer available. Refresh shipping rates." }, { status: 409 });
            shipping = { ...service, countryCode, postcode: billing.pincode, currency: quote.currency, packageWeightKg: quote.packageWeightKg };
        }
        const amount = Math.round((subtotal + (shipping?.amount ?? 0)) * 100) / 100;
        if (!Number.isFinite(amount) || amount < 1) {
            return NextResponse.json({ error: "Order amount must be at least INR 1" }, { status: 400 });
        }
        if (!Number.isFinite(body.amount) || Math.abs(body.amount - amount) > 0.01) {
            return NextResponse.json({ error: "Prices, shipping or exchange rates have changed. Refresh checkout before paying." }, { status: 409 });
        }
        let userId: string | null = null;
        const authorization = req.headers.get("authorization");
        if (authorization) {
            try {
                userId = (await getFirebaseAdmin().auth.verifyIdToken(authorization.replace(/^Bearer /, ""))).uid;
            } catch {
                return NextResponse.json({ error: "Please sign in again before paying" }, { status: 401 });
            }
        }
        const config = cashfreeConfig();
        const baseUrl = new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
        if (config.mode === "production" && baseUrl.protocol !== "https:") throw new Error("Production payments require an HTTPS app URL");
        const orderId = `kb_${randomUUID().replace(/-/g, "")}`;
        await savePendingOrder({
            userId, paymentRequestId: orderId, paymentId: "", status: "Pending", amount, items,
            billing: { name: buyerName.trim(), email: email.trim(), phone, address: billing.address.trim(), state: billing.state, pincode: billing.pincode, countryCode },
            ...(billingAddress ? { billingAddress } : {}), createdAt: new Date().toISOString(),
            ...(shipping ? { shipping } : {}),
        });
        const order = await cashfreeRequest<CashfreeOrder>("/orders", {
            order_id: orderId, order_amount: amount, order_currency: "INR",
            customer_details: { customer_id: userId || orderId, customer_name: buyerName.trim(), customer_email: email.trim(), customer_phone: phone },
            order_meta: {
                return_url: `${baseUrl.origin}/payment/success?order_id=${orderId}`,
                ...(baseUrl.protocol === "https:" && !["localhost", "127.0.0.1"].includes(baseUrl.hostname)
                    ? { notify_url: `${baseUrl.origin}/api/payment/webhook` } : {}),
            },
            order_note: "Kabdwal Bookstore order",
        });
        if (!order.payment_session_id || order.order_id !== orderId) throw new Error("Cashfree returned an invalid payment session");
        return NextResponse.json({ paymentSessionId: order.payment_session_id, orderId, mode: config.mode });
    } catch (error) {
        if (error instanceof ShippingError) return NextResponse.json({ error: error.message }, { status: error.status });
        console.error("Payment request error:", error instanceof Error ? error.message : "Unknown error");
        return NextResponse.json({ error: "Unable to create payment. Check payment configuration or try again." }, { status: 502 });
    }
}
