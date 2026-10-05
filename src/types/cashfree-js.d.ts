declare module "@cashfreepayments/cashfree-js" {
    interface CashfreeCheckoutResult {
        error?: { message?: string; code?: string };
        redirect?: boolean;
        paymentDetails?: { paymentMessage: string };
    }

    interface CashfreeCheckout {
        checkout(options: {
            paymentSessionId: string;
            redirectTarget: "_self";
        }): Promise<CashfreeCheckoutResult | undefined>;
    }

    export function load(options: { mode: "sandbox" | "production" }): Promise<CashfreeCheckout | null>;
}