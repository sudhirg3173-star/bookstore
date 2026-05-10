"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Info } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { getBookUrl } from "@/lib/utils";
import { formatPrice } from "@/store/currencyStore";

/** Convert a price in `fromCurrency` to INR using rates map (base = INR). */
function toINR(price: number, fromCurrency: string, rates: Record<string, number>): number {
    const code = fromCurrency.toUpperCase();
    if (code === "INR") return price;
    const rate = rates[code];
    return rate ? price / rate : price;
}

export default function CartPage() {
    const { items, removeItem, updateQuantity, clearCart, getTotal, getItemCount } =
        useCartStore();
    const [promoCode, setPromoCode] = useState("");
    const [promoApplied, setPromoApplied] = useState(false);

    // Live exchange rates (base = INR)
    const [rates, setRates] = useState<Record<string, number>>({ INR: 1 });
    useEffect(() => {
        fetch("/api/exchange-rates")
            .then((r) => r.json())
            .then((d) => { if (d.rates) setRates(d.rates); })
            .catch(() => { /* use default rates */ });
    }, []);

    const count = getItemCount();

    // Subtotal in INR
    const subtotalINR = items.reduce((sum, item) => {
        const unitPrice = item.book.discount
            ? item.book.price * (1 - item.book.discount / 100)
            : item.book.price;
        return sum + toINR(unitPrice * item.quantity, item.book.currency, rates);
    }, 0);

    const discountINR = promoApplied ? subtotalINR * 0.2 : 0;
    const afterDiscountINR = subtotalINR - discountINR;
    const shippingINR = afterDiscountINR > 999 ? 0 : 99;
    const totalINR = afterDiscountINR + shippingINR;

    // Currencies that need conversion (non-INR items in the cart)
    const foreignCurrencies = Array.from(
        new Set(items.map((i) => i.book.currency.toUpperCase()).filter((c) => c !== "INR"))
    );

    const handlePromo = () => {
        if (promoCode.toUpperCase() === "KWB20") {
            setPromoApplied(true);
        }
    };

    if (items.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-20">
                <ShoppingBag className="w-20 h-20 text-gray-200 mb-6" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Your Cart is Empty
                </h2>
                <p className="text-gray-500 mb-8">
                    Looks like you haven&apos;t added any books yet
                </p>
                <Link
                    href="/shop"
                    className="bg-primary text-white px-8 py-3 rounded-full font-semibold hover:bg-primary-dark transition-colors inline-flex items-center gap-2"
                >
                    Continue Shopping <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Header bar */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <h1 className="text-2xl font-extrabold text-gray-900">
                        Shopping Cart{" "}
                        <span className="text-gray-400 font-normal text-lg">
                            ({count} {count === 1 ? "item" : "items"})
                        </span>
                    </h1>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Cart items */}
                    <div className="lg:col-span-2 space-y-3">
                        {items.map((item) => {
                            const discounted = item.book.discount
                                ? item.book.price * (1 - item.book.discount / 100)
                                : null;
                            const unitPrice = discounted ?? item.book.price;

                            return (
                                <div
                                    key={item.book.sku}
                                    className="bg-white rounded-xl border border-gray-100 p-4 flex gap-4"
                                >
                                    <Link
                                        href={getBookUrl(item.book)}
                                        className="flex-shrink-0 w-16 h-22 bg-gray-50 rounded-lg overflow-hidden border border-gray-100"
                                    >
                                        <Image
                                            src={item.book.imageUrl}
                                            alt={item.book.title}
                                            width={64}
                                            height={88}
                                            className="w-full h-full object-contain p-1"
                                            onError={() => { }}
                                        />
                                    </Link>

                                    <div className="flex-1 min-w-0">
                                        <Link href={getBookUrl(item.book)}>
                                            <h3 className="font-semibold text-gray-800 hover:text-primary transition-colors text-sm line-clamp-2">
                                                {item.book.title}
                                            </h3>
                                        </Link>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {item.book.authors}
                                        </p>

                                        <div className="flex items-center justify-between mt-3">
                                            {/* Qty */}
                                            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                                                <button
                                                    onClick={() =>
                                                        updateQuantity(item.book.sku, item.quantity - 1)
                                                    }
                                                    className="px-2.5 py-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="px-3 text-sm font-medium">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        updateQuantity(item.book.sku, item.quantity + 1)
                                                    }
                                                    className="px-2.5 py-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>

                                            {/* Price */}
                                            <div className="text-right">
                                                <div className="font-bold text-primary text-sm">
                                                    {formatPrice(unitPrice * item.quantity, item.book.currency)}
                                                </div>
                                                {discounted && (
                                                    <div className="text-xs text-gray-400 line-through">
                                                        {formatPrice(item.book.price * item.quantity, item.book.currency)}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Remove */}
                                            <button
                                                onClick={() => removeItem(item.book.sku)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors ml-2"
                                                aria-label="Remove"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        <div className="flex justify-between items-center pt-2">
                            <button
                                onClick={clearCart}
                                className="text-sm text-gray-400 hover:text-red-500 transition-colors"
                            >
                                Clear Cart
                            </button>
                            <Link
                                href="/shop"
                                className="text-sm text-primary hover:underline font-medium"
                            >
                                ← Continue Shopping
                            </Link>
                        </div>
                    </div>

                    {/* Order summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-24">
                            <h2 className="text-lg font-bold text-gray-900 mb-5">
                                Order Summary
                            </h2>

                            {/* Exchange rate info — only shown when cart has non-INR items */}
                            {foreignCurrencies.length > 0 && (
                                <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 mb-4 text-xs text-blue-700">
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
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3 text-sm mb-5">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal ({count} items)</span>
                                    <span className="font-medium">{formatPrice(subtotalINR, "INR")}</span>
                                </div>
                                {discountINR > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Promo (KWB20)</span>
                                        <span>−{formatPrice(discountINR, "INR")}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-gray-600">
                                    <span>Shipping</span>
                                    <span className={shippingINR === 0 ? "text-green-600 font-medium" : ""}>
                                        {shippingINR === 0 ? "Free" : formatPrice(shippingINR, "INR")}
                                    </span>
                                </div>
                                <div className="flex justify-between font-bold text-gray-900 text-base pt-3 border-t border-gray-100">
                                    <span>Total</span>
                                    <span className="text-primary">
                                        {formatPrice(totalINR, "INR")}
                                    </span>
                                </div>
                            </div>

                            {/* Promo code */}
                            <div className="mb-5">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={promoCode}
                                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                        placeholder="Promo code (KWB20)"
                                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                                        disabled={promoApplied}
                                    />
                                    <button
                                        onClick={handlePromo}
                                        disabled={promoApplied}
                                        className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                    >
                                        Apply
                                    </button>
                                </div>
                                {promoApplied && (
                                    <p className="text-xs text-green-600 mt-1.5 font-medium">
                                        ✓ 20% discount applied!
                                    </p>
                                )}
                            </div>

                            <Link
                                href="/checkout"
                                className="w-full bg-primary hover:bg-primary-dark text-white py-3.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                            >
                                Proceed to Checkout <ArrowRight className="w-4 h-4" />
                            </Link>

                            <p className="text-xs text-gray-400 text-center mt-3">
                                🔒 Secure checkout. 30-day returns.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
