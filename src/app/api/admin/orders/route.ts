import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebaseAdmin";
import { hasAdminSession } from "@/lib/adminSession";
import { DeliveryStatus, Order } from "@/types/order";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    if (!(await hasAdminSession(request))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const { db } = getFirebaseAdmin();
        const snapshot = await db.collection("orders").orderBy("createdAt", "desc").get();
        const orders: Order[] = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Order, "id">),
        }));
        return NextResponse.json({ orders });
    } catch (err) {
        console.error("Failed to fetch orders:", err);
        return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }
}

const ORDER_STATUSES: Order["status"][] = ["Pending", "Credit", "Failed"];
const DELIVERY_STATUSES: DeliveryStatus[] = ["Processing", "On hold", "Completed", "Cancelled", "Refunded", "Failed"];

export async function POST(request: NextRequest) {
    if (!(await hasAdminSession(request))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json() as Partial<Order>;
        const paymentRequestId = typeof body.paymentRequestId === "string" ? body.paymentRequestId.trim() : "";
        const amount = body.amount;
        const createdAt = typeof body.createdAt === "string" ? new Date(body.createdAt) : null;
        const billing = body.billing;
        const item = Array.isArray(body.items) ? body.items[0] : undefined;

        if (!/^[A-Za-z0-9_-]{1,128}$/.test(paymentRequestId) ||
            typeof amount !== "number" || !Number.isFinite(amount) || amount < 0 ||
            !createdAt || !Number.isFinite(createdAt.getTime()) ||
            !ORDER_STATUSES.includes(body.status as Order["status"]) ||
            !billing || typeof billing.name !== "string" || !billing.name.trim() ||
            typeof billing.email !== "string" || typeof billing.phone !== "string" ||
            typeof billing.address !== "string" || typeof billing.state !== "string" || typeof billing.pincode !== "string" ||
            !item || typeof item.title !== "string" || !item.title.trim() ||
            typeof item.sku !== "string" || typeof item.quantity !== "number" || !Number.isInteger(item.quantity) || item.quantity < 1 ||
            typeof item.price !== "number" || !Number.isFinite(item.price) || item.price < 0) {
            return NextResponse.json({ error: "Enter a valid order reference, amount, date, buyer, and item" }, { status: 400 });
        }

        if (body.deliveryStatus !== undefined && body.deliveryStatus !== null &&
            !DELIVERY_STATUSES.includes(body.deliveryStatus as DeliveryStatus)) {
            return NextResponse.json({ error: "Invalid delivery status" }, { status: 400 });
        }

        const order: Order = {
            userId: null,
            paymentRequestId,
            paymentId: typeof body.paymentId === "string" ? body.paymentId.trim() : "",
            status: body.status as Order["status"],
            ...(body.deliveryStatus ? { deliveryStatus: body.deliveryStatus as DeliveryStatus } : {}),
            amount,
            items: [{
                title: item.title.trim(),
                authors: typeof item.authors === "string" ? item.authors : "",
                sku: item.sku.trim(),
                quantity: item.quantity,
                price: item.price,
                currency: typeof item.currency === "string" ? item.currency : "INR",
                imageUrl: typeof item.imageUrl === "string" ? item.imageUrl : "",
            }],
            billing: {
                name: billing.name.trim(), email: billing.email.trim(), phone: billing.phone.trim(),
                address: billing.address, state: billing.state, pincode: billing.pincode,
                ...(billing.countryCode ? { countryCode: billing.countryCode } : {}),
            },
            createdAt: createdAt.toISOString(),
        };

        await getFirebaseAdmin().db.collection("orders").doc(paymentRequestId).create(order);
        return NextResponse.json({ success: true, order: { ...order, id: paymentRequestId } }, { status: 201 });
    } catch (error) {
        if ((error as { code?: number | string }).code === 6 || (error as { code?: string }).code === "already-exists") {
            return NextResponse.json({ error: "An order with that reference already exists" }, { status: 409 });
        }
        console.error("Failed to create missing order:", error);
        return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }
}
