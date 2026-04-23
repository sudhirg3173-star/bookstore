import { CartItem } from "./book";

export interface CreatePaymentRequestBody {
    amount: number;
    purpose: string;
    buyerName: string;
    email: string;
    phone: string;
    items: CartItem[];
}

export interface CreatePaymentRequestResponse {
    paymentUrl: string;
    requestId: string;
}

export interface InstamojoCallbackResponse {
    paymentId: string;
    paymentRequestId: string;
    paymentStatus: string;
}

export interface InstamojoWebhookPayload {
    payment_id: string;
    payment_request_id: string;
    buyer: string;
    buyer_name: string;
    buyer_phone: string;
    currency: string;
    amount: string;
    fees: string;
    purpose: string;
    status: "Credit" | "Failed";
    longurl: string;
    mac: string;
    shipped_at?: string;
    created_at: string;
}

export interface OrderSummary {
    requestId: string;
    paymentId: string;
    amount: number;
    buyerName: string;
    email: string;
    status: "Credit" | "Failed" | "Pending";
}
