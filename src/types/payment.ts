import { CartItem } from "./book";
import { OrderBilling, OrderBillingAddress } from "./order";

export interface CreatePaymentRequestBody {
    amount: number;
    purpose: string;
    buyerName: string;
    email: string;
    phone: string;
    items: CartItem[];
    billing: OrderBilling;
    billingAddress?: OrderBillingAddress;
    shippingService?: string;
}

export interface CreatePaymentRequestResponse {
    paymentSessionId: string;
    orderId: string;
    mode: "sandbox" | "production";
}

export interface OrderSummary {
    requestId: string;
    paymentId: string;
    amount: number;
    buyerName: string;
    email: string;
    status: "Credit" | "Failed" | "Pending";
}
