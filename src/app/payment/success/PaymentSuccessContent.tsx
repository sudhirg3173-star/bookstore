"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ShoppingBag, Home, Copy, Check } from "lucide-react";
import { useState } from "react";

export default function PaymentSuccessContent() {
    const params = useSearchParams();
    const paymentId = params.get("payment_id") || "";
    const requestId = params.get("payment_request_id") || "";
    const status = params.get("status") || "";

    const [copied, setCopied] = useState(false);

    async function copyOrderId() {
        await navigator.clipboard.writeText(paymentId || requestId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    const isSuccess = !status || status === "Credit";

    return (
        <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 px-4 py-16">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm max-w-md w-full p-8 text-center">
                {isSuccess ? (
                    <>
                        <div className="flex justify-center mb-5">
                            <div className="bg-green-100 rounded-full p-4">
                                <CheckCircle2 className="w-12 h-12 text-green-500" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
                            Payment Successful!
                        </h1>
                        <p className="text-gray-500 text-sm mb-6">
                            Thank you for your order. We&apos;ve received your payment and will
                            process your order shortly.
                        </p>

                        {(paymentId || requestId) && (
                            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-6 text-left">
                                <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">
                                    Order Reference
                                </p>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-mono text-gray-700 break-all">
                                        {paymentId || requestId}
                                    </span>
                                    <button
                                        onClick={copyOrderId}
                                        className="flex-shrink-0 text-gray-400 hover:text-primary transition-colors"
                                        aria-label="Copy order ID"
                                    >
                                        {copied ? (
                                            <Check className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <Link
                                href="/shop"
                                className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                            >
                                <ShoppingBag className="w-4 h-4" />
                                Continue Shopping
                            </Link>
                            <Link
                                href="/"
                                className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                            >
                                <Home className="w-4 h-4" />
                                Back to Home
                            </Link>
                        </div>
                    </>
                ) : (
                    // Instamojo may redirect with non-Credit status even to success URL
                    <div>
                        <p className="text-gray-600 text-sm mb-4">
                            Payment status: <strong>{status}</strong>
                        </p>
                        <Link
                            href="/cart"
                            className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                        >
                            Back to Cart
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
