"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Mail, BookOpen, ShoppingBag, PenLine, LogOut,
    ShoppingCart, Heart, Edit2, Save, X, Package, Store,
    FileText, Coins,
} from "lucide-react";
import { getDocs, query, collection, where } from "firebase/firestore";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { getFirebaseFirestore } from "@/lib/firebaseClient";
import { UserRole } from "@/types/auth";
import { Order } from "@/types/order";
import { cn } from "@/lib/utils";

const roleMeta: Record<UserRole, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
    buyer: { label: "Buyer", icon: <ShoppingBag className="w-4 h-4" />, color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
    author: { label: "Author", icon: <PenLine className="w-4 h-4" />, color: "text-purple-600", bg: "bg-purple-50 border-purple-100" },
    seller: { label: "Seller", icon: <Store className="w-4 h-4" />, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
};

export default function AccountPage() {
    const router = useRouter();
    const { user, isAuthenticated, logout, updateProfile } = useAuthStore();
    const cartCount = useCartStore((s) => s.getItemCount());
    const wishlistCount = useWishlistStore((s) => s.items.length);

    const [editing, setEditing] = useState(false);
    const [name, setName] = useState("");
    const [bio, setBio] = useState("");
    const [storeName, setStoreName] = useState("");
    const [authorBio, setAuthorBio] = useState("");
    const [saved, setSaved] = useState(false);
    const loggingOutRef = useRef(false);
    const [orders, setOrders] = useState<Order[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);

    useEffect(() => {
        if (!isAuthenticated && !loggingOutRef.current) {
            router.replace("/login");
        } else if (user) {
            setName(user.name);
            setBio(user.bio || "");
            setStoreName(user.storeName || "");
            setAuthorBio(user.authorBio || "");
        }
    }, [isAuthenticated, user, router]);

    useEffect(() => {
        if (!user || user.role !== "buyer") return;
        setOrdersLoading(true);
        const db = getFirebaseFirestore();
        getDocs(query(collection(db, "orders"), where("userId", "==", user.id)))
            .then((snap) => {
                const fetched = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
                fetched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setOrders(fetched);
            })
            .catch((err) => console.error("Failed to fetch orders:", err))
            .finally(() => setOrdersLoading(false));
    }, [user]);

    if (!user) return null;

    const meta = roleMeta[user.role];

    const handleSave = () => {
        updateProfile({
            name,
            bio,
            storeName: user.role === "seller" ? storeName : undefined,
            authorBio: user.role === "author" ? authorBio : undefined,
        });
        setEditing(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const handleLogout = async () => {
        loggingOutRef.current = true;
        await logout();
        router.push("/");
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Profile header banner */}
            <div className="bg-gradient-to-r from-[#1a1c2e] to-[#302b63]">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
                        {/* Avatar */}
                        <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center text-white text-3xl font-extrabold shadow-lg flex-shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-center sm:text-left">
                            <h1 className="text-2xl font-extrabold text-white">{user.name}</h1>
                            <p className="text-white/60 text-sm mt-0.5">{user.email}</p>
                            <div className={cn("inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full border text-xs font-semibold", meta.bg, meta.color)}>
                                {meta.icon} {meta.label}
                            </div>
                        </div>
                        <div className="sm:ml-auto flex gap-2">
                            <button
                                onClick={() => setEditing(!editing)}
                                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
                            >
                                <Edit2 className="w-3.5 h-3.5" />
                                Edit Profile
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-1.5 bg-primary/80 hover:bg-primary text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
                {/* Save confirmation */}
                {saved && (
                    <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2">
                        ✓ Profile updated successfully!
                    </div>
                )}

                {/* Stats row */}
                <div className={`grid gap-4 ${user.role === "seller" || user.role === "author" ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"
                    }`}>
                    {[
                        ...(user.role === "buyer" ? [{ icon: <ShoppingCart className="w-5 h-5" />, label: "Cart Items", value: cartCount, href: "/cart" }] : []),
                        ...(user.role === "buyer" ? [{ icon: <Heart className="w-5 h-5" />, label: "Wishlisted", value: wishlistCount, href: "/wishlist" }] : []),
                        ...(user.role === "buyer" ? [{ icon: <Package className="w-5 h-5" />, label: "Orders", value: orders.length, href: "#orders" }] : []),
                        ...(user.role === "seller" ? [{ icon: <FileText className="w-5 h-5" />, label: "Invoices", value: 0, href: "#" }] : []),
                        ...(user.role === "author" ? [{ icon: <Coins className="w-5 h-5" />, label: "Royalty", value: "₹0", href: "#" }] : []),
                    ].map((stat) => (
                        <Link
                            key={stat.label}
                            href={stat.href}
                            className="bg-white rounded-2xl border border-gray-100 p-5 text-center hover:shadow-md hover:border-primary/30 transition-all group"
                        >
                            <div className="text-primary mx-auto mb-2 group-hover:scale-110 transition-transform w-fit">
                                {stat.icon}
                            </div>
                            <div className="text-2xl font-extrabold text-gray-800">{stat.value}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{stat.label}</div>
                        </Link>
                    ))}
                </div>

                {/* Profile form / info */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-bold text-gray-900">Profile Information</h2>
                        {editing && (
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSave}
                                    className="flex items-center gap-1.5 bg-primary text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary-dark transition-colors"
                                >
                                    <Save className="w-3.5 h-3.5" /> Save
                                </button>
                                <button
                                    onClick={() => { setEditing(false); setName(user.name); }}
                                    className="flex items-center gap-1.5 border border-gray-200 text-gray-500 px-4 py-1.5 rounded-lg text-xs font-semibold hover:border-gray-300 transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" /> Cancel
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        {/* Name */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                Full Name
                            </label>
                            {editing ? (
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                            ) : (
                                <p className="text-sm text-gray-800 font-medium">{user.name}</p>
                            )}
                        </div>

                        {/* Email — read only */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                Email
                            </label>
                            <p className="text-sm text-gray-800 font-medium flex items-center gap-2">
                                <Mail className="w-4 h-4 text-gray-400" /> {user.email}
                            </p>
                        </div>

                        {/* Role */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                Account Role
                            </label>
                            <div className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-semibold", meta.bg, meta.color)}>
                                {meta.icon} {meta.label}
                            </div>
                        </div>

                        {/* Bio */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                Bio
                            </label>
                            {editing ? (
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    rows={3}
                                    placeholder="Tell us a bit about yourself…"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                                />
                            ) : (
                                <p className="text-sm text-gray-600">
                                    {user.bio || <span className="text-gray-300 italic">No bio added yet</span>}
                                </p>
                            )}
                        </div>

                        {/* Seller - Store Name */}
                        {user.role === "seller" && (
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    Store Name
                                </label>
                                {editing ? (
                                    <input
                                        value={storeName}
                                        onChange={(e) => setStoreName(e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                    />
                                ) : (
                                    <p className="text-sm text-gray-800 font-medium">
                                        {user.storeName || <span className="text-gray-300 italic">Not set</span>}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Author - Bio */}
                        {user.role === "author" && (
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    Author Bio
                                </label>
                                {editing ? (
                                    <textarea
                                        value={authorBio}
                                        onChange={(e) => setAuthorBio(e.target.value)}
                                        rows={4}
                                        placeholder="Share your writing journey, published works…"
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                                    />
                                ) : (
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        {user.authorBio || <span className="text-gray-300 italic">No author bio added</span>}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Member since */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                Member Since
                            </label>
                            <p className="text-sm text-gray-600">
                                {new Date(user.createdAt).toLocaleDateString("en-IN", {
                                    year: "numeric", month: "long", day: "numeric",
                                })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Role-specific panel */}
                {user.role === "seller" && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Store className="w-5 h-5 text-emerald-500" /> Seller Dashboard
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {[
                                { label: "Active Listings", value: "0" },
                                { label: "Total Sales", value: "₹0" },
                                { label: "Pending Orders", value: "0" },
                            ].map((s) => (
                                <div key={s.label} className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                                    <div className="text-xl font-extrabold text-emerald-700">{s.value}</div>
                                    <div className="text-xs text-emerald-600 mt-0.5">{s.label}</div>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-4">
                            Listings and order management coming soon.
                        </p>

                        {/* Invoices section */}
                        <div className="mt-6 border-t border-gray-100 pt-5">
                            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-emerald-500" /> Invoices
                            </h3>
                            <div className="rounded-xl border border-gray-100 overflow-hidden">
                                <div className="grid grid-cols-4 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <span>Invoice #</span>
                                    <span>Date</span>
                                    <span>Amount</span>
                                    <span>Status</span>
                                </div>
                                <div className="px-4 py-6 text-center text-sm text-gray-400 italic">
                                    No invoices yet.
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {user.role === "author" && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <PenLine className="w-5 h-5 text-purple-500" /> Author Dashboard
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {[
                                { label: "Published Books", value: "0" },
                                { label: "Total Readers", value: "0" },
                                { label: "Reviews", value: "0" },
                            ].map((s) => (
                                <div key={s.label} className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-center">
                                    <div className="text-xl font-extrabold text-purple-700">{s.value}</div>
                                    <div className="text-xs text-purple-600 mt-0.5">{s.label}</div>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-4">
                            Book publishing tools coming soon.
                        </p>

                        {/* Royalty section */}
                        <div className="mt-6 border-t border-gray-100 pt-5">
                            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <Coins className="w-4 h-4 text-purple-500" /> Royalty Earnings
                            </h3>
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                {[
                                    { label: "Total Earned", value: "₹0" },
                                    { label: "This Month", value: "₹0" },
                                    { label: "Pending Payout", value: "₹0" },
                                ].map((s) => (
                                    <div key={s.label} className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-center">
                                        <div className="text-lg font-extrabold text-purple-700">{s.value}</div>
                                        <div className="text-xs text-purple-600 mt-0.5">{s.label}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="rounded-xl border border-gray-100 overflow-hidden">
                                <div className="grid grid-cols-4 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <span>Book</span>
                                    <span>Sales</span>
                                    <span>Rate</span>
                                    <span>Earned</span>
                                </div>
                                <div className="px-4 py-6 text-center text-sm text-gray-400 italic">
                                    No royalty records yet.
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {user.role === "buyer" && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-blue-500" /> Quick Links
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                                { label: "Continue Shopping", href: "/shop", icon: <ShoppingBag className="w-4 h-4" />, color: "bg-blue-50 border-blue-100 text-blue-700" },
                                { label: "My Wishlist", href: "/wishlist", icon: <Heart className="w-4 h-4" />, color: "bg-red-50 border-red-100 text-red-600" },
                                { label: "My Cart", href: "/cart", icon: <ShoppingCart className="w-4 h-4" />, color: "bg-amber-50 border-amber-100 text-amber-700" },
                            ].map((link) => (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    className={cn("flex items-center gap-2.5 p-4 rounded-xl border font-semibold text-sm hover:shadow-sm transition-all", link.color)}
                                >
                                    {link.icon} {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {user.role === "buyer" && (
                    <div id="orders" className="bg-white rounded-2xl border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Package className="w-5 h-5 text-blue-500" /> Order History
                        </h2>

                        {ordersLoading ? (
                            <div className="py-8 text-center text-sm text-gray-400">Loading orders…</div>
                        ) : orders.length === 0 ? (
                            <div className="py-8 text-center text-sm text-gray-400 italic">
                                No orders yet. Start shopping!
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {orders.map((order) => (
                                    <div
                                        key={order.paymentRequestId}
                                        className="border border-gray-100 rounded-xl overflow-hidden"
                                    >
                                        {/* Order header */}
                                        <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 px-4 py-3">
                                            <div className="space-y-0.5">
                                                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
                                                    Order Reference
                                                </p>
                                                <p className="text-xs font-mono text-gray-700 break-all">
                                                    {order.paymentId || order.paymentRequestId}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-400">Date</p>
                                                    <p className="text-xs font-medium text-gray-700">
                                                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                                            day: "numeric", month: "short", year: "numeric",
                                                        })}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-400">Total</p>
                                                    <p className="text-sm font-bold text-gray-800">
                                                        ₹{order.amount.toFixed(2)}
                                                    </p>
                                                </div>
                                                <span className={cn(
                                                    "px-2.5 py-1 rounded-full text-xs font-semibold",
                                                    order.status === "Credit"
                                                        ? "bg-green-100 text-green-700"
                                                        : order.status === "Failed"
                                                            ? "bg-red-100 text-red-600"
                                                            : "bg-amber-100 text-amber-700"
                                                )}>
                                                    {order.status === "Credit" ? "Paid" : order.status === "Failed" ? "Failed" : "Pending"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Order items */}
                                        <div className="divide-y divide-gray-50">
                                            {order.items.map((item) => (
                                                <div key={item.sku} className="flex items-center gap-3 px-4 py-3">
                                                    {item.imageUrl && (
                                                        <div className="w-10 h-14 flex-shrink-0 rounded overflow-hidden bg-gray-100 relative">
                                                            <Image
                                                                src={item.imageUrl}
                                                                alt={item.title}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                                                        <p className="text-xs text-gray-400 truncate">{item.authors}</p>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                                        <p className="text-xs font-semibold text-gray-700">
                                                            {item.currency} {(item.discount
                                                                ? item.price * (1 - item.discount / 100)
                                                                : item.price
                                                            ).toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Delivery address */}
                                        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                                            <p className="text-xs text-gray-400 mb-0.5 font-medium uppercase tracking-wide">Delivery To</p>
                                            <p className="text-xs text-gray-600">
                                                {order.billing.name} · {order.billing.phone}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {order.billing.address}, {order.billing.state} – {order.billing.pincode}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
