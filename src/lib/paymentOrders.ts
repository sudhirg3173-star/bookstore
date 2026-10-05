import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getFirebaseAdmin } from "@/lib/firebaseAdmin";
import { Order } from "@/types/order";
import { cashfreeOrderStatus, cashfreeRequest, CashfreeOrder } from "@/lib/cashfree";

function localStore(): boolean {
    if (process.env.PAYMENT_LOCAL_STORE !== "true") return false;
    if (process.env.NODE_ENV !== "development" || (process.env.CASHFREE_ENV || "sandbox") !== "sandbox") {
        throw new Error("Local payment storage is only allowed in development with Cashfree sandbox");
    }
    return true;
}

function orderPath(orderId: string): string {
    if (!/^kb_[a-f0-9]{32}$/.test(orderId)) throw new Error("Invalid order ID");
    return path.join(process.cwd(), ".local", "payments", `${orderId}.json`);
}

export async function savePendingOrder(order: Order): Promise<void> {
    if (localStore()) {
        const file = orderPath(order.paymentRequestId);
        await mkdir(path.dirname(file), { recursive: true });
        await writeFile(file, JSON.stringify(order), { flag: "wx" });
        return;
    }
    await getFirebaseAdmin().db.collection("orders").doc(order.paymentRequestId).create(order);
}

export async function getPaymentOrder(orderId: string): Promise<Order | null> {
    orderPath(orderId);
    if (localStore()) {
        try {
            return JSON.parse(await readFile(orderPath(orderId), "utf8")) as Order;
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
            throw error;
        }
    }
    const snapshot = await getFirebaseAdmin().db.collection("orders").doc(orderId).get();
    return snapshot.exists ? snapshot.data() as Order : null;
}

export async function confirmPaymentOrder(orderId: string): Promise<Order["status"]> {
    const order = await getPaymentOrder(orderId);
    if (!order) throw new Error("Order not found");
    const gatewayOrder = await cashfreeRequest<CashfreeOrder>(`/orders/${encodeURIComponent(orderId)}`);
    if (gatewayOrder.order_id !== orderId || gatewayOrder.order_currency !== "INR" ||
        Math.round(gatewayOrder.order_amount * 100) !== Math.round(order.amount * 100)) {
        throw new Error("Payment order does not match the stored order");
    }
    const status = cashfreeOrderStatus(gatewayOrder.order_status);
    let paymentId = order.paymentId;
    if (status === "Credit" && !paymentId) {
        const payments = await cashfreeRequest<Array<{
            cf_payment_id: string | number;
            payment_status: string;
        }>>(`/orders/${encodeURIComponent(orderId)}/payments`);
        const successfulPayment = payments.find((payment) => payment.payment_status === "SUCCESS");
        if (!successfulPayment) throw new Error("Paid order has no successful payment yet");
        paymentId = String(successfulPayment.cf_payment_id);
    }
    if (localStore()) {
        const current = await getPaymentOrder(orderId);
        const finalStatus = current?.status === "Credit" ? "Credit" : status;
        await writeFile(orderPath(orderId), JSON.stringify({ ...order, status: finalStatus, paymentId: current?.paymentId || paymentId }));
        return finalStatus;
    }
    const { db } = getFirebaseAdmin();
    const reference = db.collection("orders").doc(orderId);
    return db.runTransaction(async (transaction) => {
        const current = await transaction.get(reference);
        const finalStatus = current.data()?.status === "Credit" ? "Credit" : status;
        transaction.update(reference, { status: finalStatus, paymentId: current.data()?.paymentId || paymentId });
        return finalStatus;
    });
}