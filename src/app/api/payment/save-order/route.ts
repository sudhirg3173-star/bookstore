import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebaseAdmin";
import { Order } from "@/types/order";

// Writes the full order via the Admin SDK so it isn't blocked by client-facing
// Firestore security rules (the client SDK has no permission to write orders).
export async function POST(req: NextRequest) {
    try {
        const order: Order = await req.json();

        if (!order.paymentRequestId) {
            return NextResponse.json(
                { error: "Missing required field: paymentRequestId" },
                { status: 400 }
            );
        }

        const { db } = getFirebaseAdmin();
        await db.collection("orders").doc(order.paymentRequestId).set(order, { merge: true });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to save order:", error);
        return NextResponse.json({ error: "Failed to save order" }, { status: 500 });
    }
}
