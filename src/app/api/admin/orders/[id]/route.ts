import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebaseAdmin";
import { hasAdminSession } from "@/lib/adminSession";
import { DeliveryStatus } from "@/types/order";

export const dynamic = "force-dynamic";

const VALID_DELIVERY_STATUSES: DeliveryStatus[] = [
    "Processing",
    "On hold",
    "Completed",
    "Cancelled",
    "Refunded",
    "Failed",
];

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    if (!(await hasAdminSession(request))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const { id } = params;
        if (!id) {
            return NextResponse.json({ error: "Missing order id" }, { status: 400 });
        }

        const body = await request.json();
        const { deliveryStatus } = body as { deliveryStatus: DeliveryStatus };

        if (!VALID_DELIVERY_STATUSES.includes(deliveryStatus)) {
            return NextResponse.json({ error: "Invalid delivery status" }, { status: 400 });
        }

        const { db } = getFirebaseAdmin();
        await db.collection("orders").doc(id).update({ deliveryStatus });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Failed to update order:", err);
        return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    if (!(await hasAdminSession(request))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const body = await request.json();
        const { amount, paymentId, status, deliveryStatus, createdAt, billing } = body;
        if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0 ||
            typeof paymentId !== "string" ||
            !["Pending", "Credit", "Failed"].includes(status) ||
            (deliveryStatus !== null && deliveryStatus !== "" && !VALID_DELIVERY_STATUSES.includes(deliveryStatus)) ||
            typeof createdAt !== "string" || !Number.isFinite(new Date(createdAt).getTime()) ||
            !billing || typeof billing.name !== "string" || !billing.name.trim() ||
            typeof billing.email !== "string" || typeof billing.phone !== "string" ||
            typeof billing.address !== "string" || typeof billing.state !== "string" || typeof billing.pincode !== "string") {
            return NextResponse.json({ error: "Invalid order details" }, { status: 400 });
        }

        const updates = {
            amount,
            paymentId: paymentId.trim(),
            status,
            createdAt: new Date(createdAt).toISOString(),
            billing: {
                name: billing.name.trim(), email: billing.email.trim(), phone: billing.phone.trim(),
                address: billing.address, state: billing.state, pincode: billing.pincode,
                ...(typeof billing.countryCode === "string" && billing.countryCode ? { countryCode: billing.countryCode } : {}),
            },
            deliveryStatus: deliveryStatus || null,
        };

        await getFirebaseAdmin().db.collection("orders").doc(params.id).update(updates);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to modify order:", error);
        return NextResponse.json({ error: "Failed to modify order" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    if (!(await hasAdminSession(request))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        if (!params.id || params.id.includes("/")) {
            return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
        }
        await getFirebaseAdmin().db.collection("orders").doc(params.id).delete();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete order:", error);
        return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
    }
}
