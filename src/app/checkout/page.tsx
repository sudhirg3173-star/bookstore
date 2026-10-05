"use client";

import { useState, useEffect } from "react";
import { load } from "@cashfreepayments/cashfree-js";
import { useRouter } from "next/navigation";
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
import { useAuthStore } from "@/store/authStore";
import { cn, getBookUrl } from "@/lib/utils";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import { CreatePaymentRequestResponse } from "@/types/payment";
import { formatPrice } from "@/store/currencyStore";
import { COUNTRY_CODES, isDigitalSku, validPhone, validPostcode } from "@/lib/shippingRules";
import { ShippingQuote } from "@/types/shipping";

const countryNames = new Intl.DisplayNames(["en"], { type: "region" });
const COUNTRIES = COUNTRY_CODES.map((code) => ({ code, name: countryNames.of(code) || code }))
    .sort((first, second) => first.name.localeCompare(second.name));

/** Convert a price in `fromCurrency` to INR using the rates map (base = INR). */
function toINR(price: number, fromCurrency: string, rates: Record<string, number>): number {
    const code = fromCurrency.toUpperCase();
    if (code === "INR") return price;
    const rate = rates[code];
    if (!rate) return price; // unknown currency — keep as-is
    return price / rate;
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
    countryCode: string;
}

interface BillingAddressForm {
    address: string;
    state: string;
    pincode: string;
    countryCode: string;
}

export default function CheckoutPage() {
    const router = useRouter();
    const { items } = useCartStore();
    const { user } = useAuthStore();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState<BillingForm>({ name: "", email: "", phone: "", address: "", state: "", pincode: "", countryCode: "IN" });
    const [fieldErrors, setFieldErrors] = useState<Partial<BillingForm>>({});
    const [billingSameAsDelivery, setBillingSameAsDelivery] = useState(true);
    const [billingAddressForm, setBillingAddressForm] = useState<BillingAddressForm>({ address: "", state: "", pincode: "", countryCode: "IN" });
    const [billingAddressErrors, setBillingAddressErrors] = useState<Partial<BillingAddressForm>>({});
    const [quoteResult, setQuoteResult] = useState<{ key: string; quote: ShippingQuote } | null>(null);
    const [shippingError, setShippingError] = useState<{ key: string; message: string } | null>(null);
    const [selectedServiceTitle, setSelectedServiceTitle] = useState("");
    const [quoteAttempt, setQuoteAttempt] = useState(0);
    const needsShipping = form.countryCode !== "IN" && items.some((item) => !isDigitalSku(item.book.sku));
    const quoteKey = JSON.stringify({
        items: items.map((item) => ({ sku: item.book.sku, quantity: item.quantity })),
        countryCode: form.countryCode, postcode: form.pincode.trim(),
    });
    const quote = quoteResult?.key === quoteKey ? quoteResult.quote : null;
    const selectedService = needsShipping ? quote?.services.find((service) => service.title === selectedServiceTitle) : undefined;
    const currentShippingError = shippingError?.key === quoteKey ? shippingError.message : null;

    useEffect(() => {
        setQuoteResult(null);
        setShippingError(null);
        setSelectedServiceTitle("");
        if (!needsShipping) return;
        const destination = JSON.parse(quoteKey);
        if (!validPostcode(destination.postcode, destination.countryCode)) return;
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setShippingError(null);
            try {
                const response = await fetch("/api/shipping/quote", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: quoteKey, signal: controller.signal,
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || "Unable to fetch shipping rates");
                if (controller.signal.aborted) return;
                setQuoteResult({ key: quoteKey, quote: data });
                setSelectedServiceTitle(data.services[0]?.title || "");
            } catch (error) {
                if (!controller.signal.aborted) setShippingError({ key: quoteKey, message: error instanceof Error ? error.message : "Unable to fetch shipping rates" });
            }
        }, 600);
        return () => { clearTimeout(timer); controller.abort(); };
    }, [needsShipping, quoteKey, quoteAttempt]);

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
    const shippingINR = selectedService?.amount ?? 0;
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
        } else if (!validPhone(form.phone, form.countryCode)) {
            errors.phone = form.countryCode === "IN" ? "Enter a valid 10-digit mobile number" : "Enter a valid phone number including country code";
        }
        if (!form.address.trim()) errors.address = "Delivery address is required";
        if (!form.state) errors.state = "State is required";
        if (!form.pincode.trim()) {
            errors.pincode = "Pincode is required";
        } else if (!validPostcode(form.pincode.trim(), form.countryCode)) {
            errors.pincode = form.countryCode === "IN" ? "Enter a valid 6-digit pincode" : "Enter a valid postal code";
        }
        setFieldErrors(errors);

        const baErrors: Partial<BillingAddressForm> = {};
        if (!billingSameAsDelivery) {
            if (!billingAddressForm.address.trim()) baErrors.address = "Billing address is required";
            if (!billingAddressForm.state) baErrors.state = "State is required";
            if (!billingAddressForm.pincode.trim()) {
                baErrors.pincode = "Pincode is required";
            } else if (!validPostcode(billingAddressForm.pincode.trim(), billingAddressForm.countryCode)) {
                baErrors.pincode = billingAddressForm.countryCode === "IN" ? "Enter a valid 6-digit pincode" : "Enter a valid postal code";
            }
        }
        setBillingAddressErrors(baErrors);

        return Object.keys(errors).length === 0 && Object.keys(baErrors).length === 0;
    }

    async function handlePayNow() {
        if (!validate()) return;
        if (needsShipping && !selectedService) {
            setError("Select an available shipping service before paying.");
            return;
        }
        setError(null);
        setIsProcessing(true);

        const purpose =
            items.length === 1
                ? `Order: ${items[0].book.title}`
                : `Order: ${items.length} books from Kabdwalbook`;

        try {
            const token = user ? await getFirebaseAuth().currentUser?.getIdToken() : undefined;
            const res = await fetch("/api/payment/create-request", {
                method: "POST",
                headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify({
                    amount: grandTotalINR,
                    purpose,
                    buyerName: form.name.trim(),
                    email: form.email.trim(),
                    phone: form.phone.trim(),
                    items,
                    ...(selectedService ? { shippingService: selectedService.title } : {}),
                    billing: {
                        name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(),
                        address: form.address.trim(), state: form.state, pincode: form.pincode.trim(), countryCode: form.countryCode,
                    },
                    ...(!billingSameAsDelivery ? {
                        billingAddress: {
                            address: billingAddressForm.address.trim(), state: billingAddressForm.state,
                            pincode: billingAddressForm.pincode.trim(), countryCode: billingAddressForm.countryCode,
                        }
                    } : {}),
                }),
            });

            const data: CreatePaymentRequestResponse & { error?: string } =
                await res.json();

            if (!res.ok || data.error) {
                setError(data.error || "Failed to initiate payment. Please try again.");
                if (res.status === 409 && needsShipping) {
                    setQuoteResult(null);
                    setQuoteAttempt((attempt) => attempt + 1);
                }
                setIsProcessing(false);
                return;
            }

            const cashfree = await load({ mode: data.mode });
            if (!cashfree) throw new Error("Unable to load payment checkout");
            sessionStorage.setItem("cashfree-pending-order", data.orderId);
            const result = await cashfree.checkout({ paymentSessionId: data.paymentSessionId, redirectTarget: "_self" });
            if (result?.error) throw new Error(result.error.message || "Unable to open payment checkout");
            setIsProcessing(false);
        } catch {
            setError("Network error. Please check your connection and try again.");
            setIsProcessing(false);
        }
    }

    if (items.length === 0) return null;

    return (
        <>
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
                                    <div>
                                        <label htmlFor="delivery-country" className="block text-sm font-medium text-gray-700 mb-1">Delivery Country</label>
                                        <select id="delivery-country" value={form.countryCode} disabled={isProcessing}
                                            onChange={(event) => {
                                                setForm({ ...form, countryCode: event.target.value, state: "", pincode: "" });
                                                setFieldErrors({});
                                            }}
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white">
                                            {COUNTRIES.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}
                                        </select>
                                    </div>
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
                                            {form.countryCode === "IN" && <div className="absolute left-10 top-1/2 -translate-y-1/2 text-sm text-gray-400 border-r border-gray-200 pr-2">
                                                +91
                                            </div>}
                                            <input
                                                type="tel"
                                                value={form.phone}
                                                onChange={(e) => {
                                                    const val = form.countryCode === "IN" ? e.target.value.replace(/\D/g, "").slice(0, 10)
                                                        : e.target.value.replace(/[^\d+]/g, "").slice(0, 16);
                                                    setForm({ ...form, phone: val });
                                                    setFieldErrors({ ...fieldErrors, phone: undefined });
                                                }}
                                                placeholder={form.countryCode === "IN" ? "10-digit mobile number" : "+447911123456"}
                                                className={cn("w-full pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors", form.countryCode === "IN" ? "pl-20" : "pl-10", fieldErrors.phone ? "border-red-400" : "border-gray-200")}
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
                                            {form.countryCode !== "IN" ? <input aria-label="Delivery state or region" value={form.state}
                                                onChange={(event) => setForm({ ...form, state: event.target.value })}
                                                placeholder="State / Region" className={cn("w-full px-3 py-2.5 border rounded-lg text-sm", fieldErrors.state ? "border-red-400" : "border-gray-200")} /> : <select
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
                                            </select>}
                                            {fieldErrors.state && (
                                                <p className="text-xs text-red-500 mt-1">{fieldErrors.state}</p>
                                            )}
                                        </div>

                                        {/* Pincode */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Postal Code <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={form.pincode}
                                                    onChange={(e) => {
                                                        const val = form.countryCode === "IN" ? e.target.value.replace(/\D/g, "").slice(0, 6) : e.target.value.slice(0, 20);
                                                        setForm({ ...form, pincode: val });
                                                        setFieldErrors({ ...fieldErrors, pincode: undefined });
                                                    }}
                                                    placeholder={form.countryCode === "IN" ? "6-digit pincode" : "Postal code"}
                                                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors ${fieldErrors.pincode ? "border-red-400" : "border-gray-200"}`}
                                                />
                                            </div>
                                            {fieldErrors.pincode && (
                                                <p className="text-xs text-red-500 mt-1">{fieldErrors.pincode}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Billing Address */}
                                    <div className="pt-4 border-t border-gray-100">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-primary" />
                                                Billing Address
                                            </h3>
                                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={billingSameAsDelivery}
                                                    onChange={(e) => {
                                                        setBillingSameAsDelivery(e.target.checked);
                                                        if (e.target.checked) setBillingAddressErrors({});
                                                    }}
                                                    className="w-4 h-4 rounded accent-primary"
                                                />
                                                <span className="text-xs text-gray-500">Same as delivery address</span>
                                            </label>
                                        </div>

                                        {billingSameAsDelivery ? (
                                            <p className="text-xs text-gray-400 italic">Billing address will match the delivery address above.</p>
                                        ) : (
                                            <div className="space-y-3">
                                                <div>
                                                    <label htmlFor="billing-country" className="block text-sm font-medium text-gray-700 mb-1">Billing Country</label>
                                                    <select id="billing-country" value={billingAddressForm.countryCode}
                                                        onChange={(event) => {
                                                            setBillingAddressForm({ ...billingAddressForm, countryCode: event.target.value, state: "", pincode: "" });
                                                            setBillingAddressErrors({});
                                                        }} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white">
                                                        {COUNTRIES.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}
                                                    </select>
                                                </div>
                                                {/* Billing Address textarea */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Address <span className="text-red-500">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                                        <textarea
                                                            value={billingAddressForm.address}
                                                            onChange={(e) => {
                                                                setBillingAddressForm({ ...billingAddressForm, address: e.target.value });
                                                                setBillingAddressErrors({ ...billingAddressErrors, address: undefined });
                                                            }}
                                                            placeholder="Flat / House No., Street, Area, City, State"
                                                            rows={3}
                                                            className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors resize-none ${billingAddressErrors.address ? "border-red-400" : "border-gray-200"}`}
                                                        />
                                                    </div>
                                                    {billingAddressErrors.address && (
                                                        <p className="text-xs text-red-500 mt-1">{billingAddressErrors.address}</p>
                                                    )}
                                                </div>

                                                {/* Billing State + Pincode */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            State <span className="text-red-500">*</span>
                                                        </label>
                                                        {billingAddressForm.countryCode !== "IN" ? <input aria-label="Billing state or region" value={billingAddressForm.state}
                                                            onChange={(event) => setBillingAddressForm({ ...billingAddressForm, state: event.target.value })}
                                                            placeholder="State / Region" className={cn("w-full px-3 py-2.5 border rounded-lg text-sm", billingAddressErrors.state ? "border-red-400" : "border-gray-200")} /> : <select
                                                                value={billingAddressForm.state}
                                                                onChange={(e) => {
                                                                    setBillingAddressForm({ ...billingAddressForm, state: e.target.value });
                                                                    setBillingAddressErrors({ ...billingAddressErrors, state: undefined });
                                                                }}
                                                                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors bg-white ${billingAddressErrors.state ? "border-red-400" : "border-gray-200"}`}
                                                            >
                                                            <option value="">Select state</option>
                                                            {INDIAN_STATES.map((s) => (
                                                                <option key={s} value={s}>{s}</option>
                                                            ))}
                                                        </select>}
                                                        {billingAddressErrors.state && (
                                                            <p className="text-xs text-red-500 mt-1">{billingAddressErrors.state}</p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Postal Code <span className="text-red-500">*</span>
                                                        </label>
                                                        <div className="relative">
                                                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                            <input
                                                                type="text"
                                                                value={billingAddressForm.pincode}
                                                                onChange={(e) => {
                                                                    const val = billingAddressForm.countryCode === "IN" ? e.target.value.replace(/\D/g, "").slice(0, 6) : e.target.value.slice(0, 20);
                                                                    setBillingAddressForm({ ...billingAddressForm, pincode: val });
                                                                    setBillingAddressErrors({ ...billingAddressErrors, pincode: undefined });
                                                                }}
                                                                placeholder={billingAddressForm.countryCode === "IN" ? "6-digit pincode" : "Postal code"}
                                                                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors ${billingAddressErrors.pincode ? "border-red-400" : "border-gray-200"}`}
                                                            />
                                                        </div>
                                                        {billingAddressErrors.pincode && (
                                                            <p className="text-xs text-red-500 mt-1">{billingAddressErrors.pincode}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
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
                                    <span className="font-semibold text-gray-700">Cashfree</span>.
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

                                {needsShipping && <fieldset className="border-t border-gray-100 pt-4 mb-4 min-w-0">
                                    <legend className="text-sm font-semibold text-gray-800">Shipping Service</legend>
                                    {!validPostcode(form.pincode.trim(), form.countryCode) ? <p className="text-xs text-gray-500 mt-2">Enter a valid destination postal code.</p>
                                        : currentShippingError ? <p role="alert" className="text-xs text-red-600 mt-2">{currentShippingError}</p>
                                            : !quote ? <p role="status" className="flex items-center gap-2 text-xs text-gray-500 mt-2"><Loader2 className="w-4 h-4 animate-spin" />Fetching shipping rates...</p>
                                                : <div className="divide-y divide-gray-100">
                                                    <p className="flex flex-wrap justify-between gap-x-3 gap-y-1 py-2 text-xs text-gray-500">
                                                        <span>Parcel weight</span>
                                                        <span className="font-medium text-gray-700">{quote.packageWeightKg.toLocaleString("en-IN", { maximumFractionDigits: 3 })} kg</span>
                                                    </p>
                                                    {quote.services.map((service) => <label key={service.title} className="flex gap-2 py-3 items-start cursor-pointer">
                                                        <input type="radio" name="shipping-service" checked={selectedServiceTitle === service.title} disabled={isProcessing}
                                                            onChange={() => setSelectedServiceTitle(service.title)} className="mt-1 accent-primary" />
                                                        <span className="flex-1 min-w-0 text-xs text-gray-700 break-words">
                                                            <span className="font-semibold">{service.title}</span>
                                                            {service.transitTime && <span className="block text-gray-500 mt-1">{service.transitTime}</span>}
                                                            {service.notes && <span className="block text-gray-500 mt-1">{service.notes}</span>}
                                                            <span className="block font-semibold text-primary mt-1">{formatPrice(service.amount, "INR")}</span>
                                                        </span>
                                                    </label>)}
                                                </div>}
                                    <button type="button" disabled={isProcessing || !validPostcode(form.pincode.trim(), form.countryCode)}
                                        onClick={() => { setQuoteResult(null); setShippingError(null); setQuoteAttempt((attempt) => attempt + 1); }}
                                        className="mt-2 inline-flex items-center gap-1 text-xs text-primary disabled:opacity-50">
                                        <RefreshCw className="w-3 h-3" />Refresh Rates
                                    </button>
                                </fieldset>}

                                {/* Totals — all in INR */}
                                <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Subtotal</span>
                                        <span>{formatPrice(subtotalINR, "INR")}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Shipping</span>
                                        <span className={cn(!needsShipping && "text-green-600 font-medium")}>
                                            {needsShipping && !selectedService ? "Pending" : shippingINR === 0 ? "Free" : formatPrice(shippingINR, "INR")}
                                        </span>
                                    </div>
                                    <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
                                        <span>Total (INR)</span>
                                        <span className="text-primary">{needsShipping && !selectedService ? "Pending" : formatPrice(grandTotalINR, "INR")}</span>
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
                                    disabled={isProcessing || ratesLoading || (needsShipping && !selectedService)}
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
                                            {needsShipping && !selectedService ? "Shipping Required" : `Pay ${formatPrice(grandTotalINR, "INR")} with Cashfree`}
                                        </>
                                    )}
                                </button>

                                <p className="text-xs text-gray-400 text-center mt-3">
                                    🔒 Secure, encrypted payment via Cashfree
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
