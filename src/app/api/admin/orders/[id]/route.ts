import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebaseAdmin";
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
