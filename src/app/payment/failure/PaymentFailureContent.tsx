"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle, ShoppingCart, Home, RefreshCw } from "lucide-react";

export default function PaymentFailureContent() {
    const params = useSearchParams();
    const paymentId = params.get("payment_id") || "";
    const status = params.get("status") || "Failed";

    return (
        <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 px-4 py-16">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm max-w-md w-full p-8 text-center">
                <div className="flex justify-center mb-5">
                    <div className="bg-red-100 rounded-full p-4">
                        <XCircle className="w-12 h-12 text-red-500" />
                    </div>
                </div>

                <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
                    Payment Failed
                </h1>
                <p className="text-gray-500 text-sm mb-6">
                    {status === "Failed"
                        ? "Your payment could not be processed. No amount has been charged. Please try again."
                        : "The payment was cancelled. Your cart items are saved — you can try again anytime."}
                </p>

                {paymentId && (
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 mb-6">
                        <p className="text-xs text-gray-400">
                            Reference ID:{" "}
                            <span className="font-mono text-gray-600">{paymentId}</span>
                        </p>
                    </div>
                )}

                <div className="space-y-3">
                    <Link
                        href="/checkout"
                        className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </Link>
                    <Link
                        href="/cart"
                        className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                    >
                        <ShoppingCart className="w-4 h-4" />
                        Back to Cart
                    </Link>
                    <Link
                        href="/"
                        className="w-full text-gray-400 hover:text-gray-600 py-2 text-sm transition-colors flex items-center justify-center gap-2"
                    >
                        <Home className="w-4 h-4" />
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
