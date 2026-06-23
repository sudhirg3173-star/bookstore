export interface OrderItem {
    title: string;
    authors: string;
    sku: string;
    quantity: number;
    price: number;
    currency: string;
    discount?: number;
    imageUrl: string;
}

export interface OrderBilling {
    name: string;
    email: string;
    phone: string;
    address: string;
    state: string;
    pincode: string;
}

export interface OrderBillingAddress {
    address: string;
    state: string;
    pincode: string;
}

export type DeliveryStatus = "Processing" | "On hold" | "Completed" | "Cancelled" | "Refunded" | "Failed";

export interface Order {
    id?: string;
    userId: string | null;
    paymentRequestId: string;
    paymentId: string;
    status: "Pending" | "Credit" | "Failed";
    deliveryStatus?: DeliveryStatus;
    amount: number;
    items: OrderItem[];
    billing: OrderBilling;
    billingAddress?: OrderBillingAddress;
    createdAt: string;
}
