import { Suspense } from "react";
import PaymentFailureContent from "./PaymentFailureContent";

export default function PaymentFailurePage() {
    return (
        <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center" />}>
            <PaymentFailureContent />
        </Suspense>
    );
}
