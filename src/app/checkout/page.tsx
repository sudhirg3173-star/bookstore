"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import Image from "next/image";
import Link from "next/link";
import {
    ShoppingBag,
    ArrowLeft,
    Lock,
    CreditCard,
    User,
    Mail,
    Phone,
    MapPin,
    Hash,
    AlertCircle,
    Loader2,
    RefreshCw,
    Info,
} from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { getBookUrl } from "@/lib/utils";
import { CreatePaymentRequestResponse } from "@/types/payment";
import { formatPrice } from "@/store/currencyStore";

/** Convert a price in `fromCurrency` to INR using the rates map (base = INR). */
function toINR(price: number, fromCurrency: string, rates: Record<string, number>): number {
    const code = fromCurrency.toUpperCase();
    if (code === "INR") return price;
    const rate = rates[code];
    if (!rate) return price; // unknown currency — keep as-is
    return price / rate;
}

// Extend window with Instamojo global
declare global {
    interface Window {
        Instamojo: {
            open: (url: string) => void;
            close: () => void;
            configure: (options: {
                handlers?: {
                    onOpen?: () => void;
                    onClose?: () => void;
                    onSuccess?: (response: Record<string, string>) => void;
                    onFailure?: (response: Record<string, string>) => void;
                };
                directPaymentMode?: string;
            }) => void;
        };
    }
}

const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

interface BillingForm {
    name: string;
    email: string;
    phone: string;
    address: string;
    state: string;
    pincode: string;
}

export default function CheckoutPage() {
    const router = useRouter();
    const { items, getTotal, clearCart } = useCartStore();
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState<BillingForm>({ name: "", email: "", phone: "", address: "", state: "", pincode: "" });
    const [fieldErrors, setFieldErrors] = useState<Partial<BillingForm>>({});
    const paymentUrlRef = useRef<string | null>(null);

    // Live exchange rates (base = INR)
    const [rates, setRates] = useState<Record<string, number>>({ INR: 1 });
    const [ratesLoading, setRatesLoading] = useState(true);
    const [ratesFallback, setRatesFallback] = useState(false);

    useEffect(() => {
        fetch("/api/exchange-rates")
            .then((r) => r.json())
            .then((data) => {
                if (data.rates) setRates(data.rates);
                if (data.fallback) setRatesFallback(true);
            })
            .catch(() => setRatesFallback(true))
            .finally(() => setRatesLoading(false));
    }, []);

    // All monetary values on checkout are in INR
    const subtotalINR = items.reduce((sum, item) => {
        const unitPrice = item.book.discount
            ? item.book.price * (1 - item.book.discount / 100)
            : item.book.price;
        return sum + toINR(unitPrice * item.quantity, item.book.currency, rates);
    }, 0);
    const shippingINR = subtotalINR > 999 ? 0 : 99;
    const grandTotalINR = Math.round((subtotalINR + shippingINR) * 100) / 100;

    // Currencies in the cart that need conversion
    const foreignCurrencies = Array.from(
        new Set(items.map((i) => i.book.currency.toUpperCase()).filter((c) => c !== "INR"))
    );

    // Redirect if cart is empty
    useEffect(() => {
        if (items.length === 0) {
            router.replace("/cart");
        }
    }, [items.length, router]);

    function validate(): boolean {
        const errors: Partial<BillingForm> = {};
        if (!form.name.trim()) errors.name = "Name is required";
        if (!form.email.trim()) {
            errors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            errors.email = "Enter a valid email address";
        }
        if (!form.phone.trim()) {
            errors.phone = "Mobile number is required";
        } else if (!/^[6-9]\d{9}$/.test(form.phone)) {
            errors.phone = "Enter a valid 10-digit mobile number";
        }
        if (!form.address.trim()) errors.address = "Delivery address is required";
        if (!form.state) errors.state = "State is required";
        if (!form.pincode.trim()) {
            errors.pincode = "Pincode is required";
        } else if (!/^\d{6}$/.test(form.pincode)) {
            errors.pincode = "Enter a valid 6-digit pincode";
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    }

    function configurInstamojo(paymentUrl: string) {
        window.Instamojo.configure({
            handlers: {
                onOpen: () => setIsProcessing(false),
                onClose: () => {
                    setIsProcessing(false);
                },
                onSuccess: (response) => {
                    clearCart();
                    const params = new URLSearchParams({
                        payment_id: response.paymentId || "",
                        payment_request_id: response.paymentRequestId || "",
                        status: response.paymentStatus || "Credit",
                    });
                    router.push(`/payment/success?${params.toString()}`);
                },
                onFailure: (response) => {
                    const params = new URLSearchParams({
                        payment_id: response.paymentId || "",
                        status: response.paymentStatus || "Failed",
                    });
                    router.push(`/payment/failure?${params.toString()}`);
                },
            },
        });
        window.Instamojo.open(paymentUrl);
    }

    async function handlePayNow() {
        if (!validate()) return;
        setError(null);
        setIsProcessing(true);

        const purpose =
            items.length === 1
                ? `Order: ${items[0].book.title}`
                : `Order: ${items.length} books from Kabdwalbook`;

        try {
            const res = await fetch("/api/payment/create-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: grandTotalINR,
                    purpose,
                    buyerName: form.name.trim(),
                    email: form.email.trim(),
                    phone: form.phone.trim(),
                    items,
                }),
            });

            const data: CreatePaymentRequestResponse & { error?: string } =
                await res.json();

            if (!res.ok || data.error) {
                setError(data.error || "Failed to initiate payment. Please try again.");
                setIsProcessing(false);
                return;
            }

            paymentUrlRef.current = data.paymentUrl;

            if (scriptLoaded && window.Instamojo) {
                configurInstamojo(data.paymentUrl);
            } else {
                // Script not ready yet — it will call configurInstamojo once loaded
                setIsProcessing(true);
            }
        } catch {
            setError("Network error. Please check your connection and try again.");
            setIsProcessing(false);
        }
    }

    function handleScriptLoad() {
        setScriptLoaded(true);
        // If payment URL was already obtained while script was loading, open now
        if (paymentUrlRef.current && window.Instamojo) {
            configurInstamojo(paymentUrlRef.current);
        }
    }

    if (items.length === 0) return null;

    return (
        <>
            <Script
                src="https://js.instamojo.com/v1/checkout.js"
                strategy="afterInteractive"
                onLoad={handleScriptLoad}
            />

            <div className="bg-gray-50 min-h-screen">
                {/* Header */}
                <div className="bg-white border-b border-gray-100">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
                        <Link
                            href="/cart"
                            className="text-gray-400 hover:text-gray-700 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-2xl font-extrabold text-gray-900">Checkout</h1>
                        <Lock className="w-4 h-4 text-green-500 ml-1" />
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        {/* Billing details */}
                        <div className="lg:col-span-3 space-y-6">
                            <div className="bg-white rounded-xl border border-gray-100 p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                                    <User className="w-5 h-5 text-primary" />
                                    Billing Details
                                </h2>

                                <div className="space-y-4">
                                    {/* Full Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Full Name <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                value={form.name}
                                                onChange={(e) => {
                                                    setForm({ ...form, name: e.target.value });
                                                    setFieldErrors({ ...fieldErrors, name: undefined });
                                                }}
                                                placeholder="Enter your full name"
                                                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors ${fieldErrors.name ? "border-red-400" : "border-gray-200"}`}
                                            />
                                        </div>
                                        {fieldErrors.name && (
                                            <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email Address <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="email"
                                                value={form.email}
                                                onChange={(e) => {
                                                    setForm({ ...form, email: e.target.value });
                                                    setFieldErrors({ ...fieldErrors, email: undefined });
                                                }}
                                                placeholder="you@example.com"
                                                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors ${fieldErrors.email ? "border-red-400" : "border-gray-200"}`}
                                            />
                                        </div>
                                        {fieldErrors.email && (
                                            <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>
                                        )}
                                    </div>

                                    {/* Phone */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Mobile Number <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <div className="absolute left-10 top-1/2 -translate-y-1/2 text-sm text-gray-400 border-r border-gray-200 pr-2">
                                                +91
                                            </div>
                                            <input
                                                type="tel"
                                                value={form.phone}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                                                    setForm({ ...form, phone: val });
                                                    setFieldErrors({ ...fieldErrors, phone: undefined });
                                                }}
                                                placeholder="10-digit mobile number"
                                                className={`w-full pl-20 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors ${fieldErrors.phone ? "border-red-400" : "border-gray-200"}`}
                                            />
                                        </div>
                                        {fieldErrors.phone && (
                                            <p className="text-xs text-red-500 mt-1">{fieldErrors.phone}</p>
                                        )}
                                    </div>

                                    {/* Delivery Address */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Delivery Address <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                            <textarea
                                                value={form.address}
                                                onChange={(e) => {
                                                    setForm({ ...form, address: e.target.value });
                                                    setFieldErrors({ ...fieldErrors, address: undefined });
                                                }}
                                                placeholder="Flat / House No., Street, Area, City, State"
                                                rows={3}
                                                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors resize-none ${fieldErrors.address ? "border-red-400" : "border-gray-200"}`}
                                            />
                                        </div>
                                        {fieldErrors.address && (
                                            <p className="text-xs text-red-500 mt-1">{fieldErrors.address}</p>
                                        )}
                                    </div>

                                    {/* State + Pincode side by side */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* State */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                State <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={form.state}
                                                onChange={(e) => {
                                                    setForm({ ...form, state: e.target.value });
                                                    setFieldErrors({ ...fieldErrors, state: undefined });
                                                }}
                                                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors bg-white ${fieldErrors.state ? "border-red-400" : "border-gray-200"}`}
                                            >
                                                <option value="">Select state</option>
                                                {INDIAN_STATES.map((s) => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                            {fieldErrors.state && (
                                                <p className="text-xs text-red-500 mt-1">{fieldErrors.state}</p>
                                            )}
                                        </div>

                                        {/* Pincode */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Pincode <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={form.pincode}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                                                        setForm({ ...form, pincode: val });
                                                        setFieldErrors({ ...fieldErrors, pincode: undefined });
                                                    }}
                                                    placeholder="6-digit pincode"
                                                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors ${fieldErrors.pincode ? "border-red-400" : "border-gray-200"}`}
                                                />
                                            </div>
                                            {fieldErrors.pincode && (
                                                <p className="text-xs text-red-500 mt-1">{fieldErrors.pincode}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment method info */}
                            <div className="bg-white rounded-xl border border-gray-100 p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-primary" />
                                    Payment Method
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Payments are processed securely via{" "}
                                    <span className="font-semibold text-gray-700">Instamojo</span>.
                                    You can pay using UPI, Net Banking, Debit/Credit Cards, or
                                    Wallets.
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {["UPI", "Net Banking", "Debit Card", "Credit Card", "Wallets"].map(
                                        (method) => (
                                            <span
                                                key={method}
                                                className="text-xs bg-gray-50 border border-gray-200 text-gray-600 px-2.5 py-1 rounded-full"
                                            >
                                                {method}
                                            </span>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-24">
                                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <ShoppingBag className="w-5 h-5 text-primary" />
                                    Order Summary
                                </h2>

                                {/* Exchange rate notice */}
                                {ratesLoading ? (
                                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                                        <Loader2 className="w-3 h-3 animate-spin" /> Fetching live exchange rates…
                                    </div>
                                ) : (
                                    <>
                                        {ratesFallback && (
                                            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                                                <RefreshCw className="w-3 h-3 shrink-0" />
                                                Using approximate rates. Live rates unavailable.
                                            </div>
                                        )}
                                        {foreignCurrencies.length > 0 && (
                                            <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 mb-3 text-xs text-blue-700">
                                                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="font-semibold mb-1">Live exchange rates (to ₹ INR)</p>
                                                    {foreignCurrencies.map((code) => {
                                                        const rate = rates[code];
                                                        const inrPerUnit = rate ? (1 / rate) : null;
                                                        return (
                                                            <p key={code}>
                                                                1 {code} = {inrPerUnit ? `₹ ${inrPerUnit.toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : "…"}
                                                            </p>
                                                        );
                                                    })}
                                                    <p className="text-blue-500 mt-1">All prices converted to INR at checkout.</p>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Items */}
                                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
                                    {items.map((item) => {
                                        const discounted = item.book.discount
                                            ? item.book.price * (1 - item.book.discount / 100)
                                            : null;
                                        const unitPrice = discounted ?? item.book.price;
                                        const lineOriginal = unitPrice * item.quantity;
                                        const lineINR = toINR(lineOriginal, item.book.currency, rates);
                                        const isNonINR = item.book.currency.toUpperCase() !== "INR";

                                        return (
                                            <div key={item.book.sku} className="flex gap-3 items-start">
                                                <Link
                                                    href={getBookUrl(item.book)}
                                                    className="flex-shrink-0 w-10 h-14 bg-gray-50 rounded border border-gray-100 overflow-hidden"
                                                >
                                                    {item.book.imageUrl ? (
                                                        <Image
                                                            src={item.book.imageUrl}
                                                            alt={item.book.title}
                                                            width={40}
                                                            height={56}
                                                            className="w-full h-full object-contain p-0.5"
                                                            onError={() => { }}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 text-white gap-0.5 p-0.5">
                                                            <span className="text-[7px] font-black tracking-tight text-center leading-tight">
                                                                {item.book.authors}
                                                            </span>
                                                            <span className="text-[6px] bg-white/20 px-0.5 rounded">STD</span>
                                                        </div>
                                                    )}
                                                </Link>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-gray-800 line-clamp-2">
                                                        {item.book.title}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        Qty: {item.quantity}
                                                    </p>
                                                    {isNonINR && (
                                                        <p className="text-[10px] text-gray-400">
                                                            {formatPrice(lineOriginal, item.book.currency)}
                                                        </p>
                                                    )}
                                                </div>
                                                <span className="text-xs font-bold text-primary whitespace-nowrap">
                                                    {formatPrice(lineINR, "INR")}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Totals — all in INR */}
                                <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Subtotal</span>
                                        <span>{formatPrice(subtotalINR, "INR")}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Shipping</span>
                                        <span className={shippingINR === 0 ? "text-green-600 font-medium" : ""}>
                                            {shippingINR === 0 ? "Free" : formatPrice(shippingINR, "INR")}
                                        </span>
                                    </div>
                                    <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
                                        <span>Total (INR)</span>
                                        <span className="text-primary">{formatPrice(grandTotalINR, "INR")}</span>
                                    </div>
                                </div>

                                {/* Error */}
                                {error && (
                                    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-xs text-red-600">{error}</p>
                                    </div>
                                )}

                                {/* Pay button */}
                                <button
                                    onClick={handlePayNow}
                                    disabled={isProcessing || ratesLoading}
                                    className="mt-5 w-full bg-primary hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Opening Payment...
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="w-4 h-4" />
                                            Pay {formatPrice(grandTotalINR, "INR")} with Instamojo
                                        </>
                                    )}
                                </button>

                                <p className="text-xs text-gray-400 text-center mt-3">
                                    🔒 Secure, encrypted payment via Instamojo
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
