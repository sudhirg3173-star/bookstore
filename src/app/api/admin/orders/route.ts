import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebaseAdmin";
import { Order } from "@/types/order";

export const dynamic = "force-dynamic";

export async function GET() {
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
