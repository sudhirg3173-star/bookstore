import { Suspense } from "react";
import PaymentSuccessContent from "./PaymentSuccessContent";

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center" />}>
            <PaymentSuccessContent />
        </Suspense>
    );
}
