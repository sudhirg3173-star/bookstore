"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Eye, EyeOff, BookOpen, Mail, Lock, User, AlertCircle,
    Loader2, CheckCircle2,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
    const router = useRouter();
    const register = useAuthStore((s) => s.register);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (isAuthenticated) {
        router.replace("/account");
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!name.trim()) return setError("Please enter your full name.");
        if (!email.trim()) return setError("Please enter your email address.");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Please enter a valid email address.");
        if (password.length < 6) return setError("Password must be at least 6 characters.");
        if (password !== confirmPassword) return setError("Passwords do not match.");

        setLoading(true);
        const result = await register({ name, email, password, role: "buyer", storeName: "", authorBio: "" });
        setLoading(false);

        if (result.success) {
            router.push("/account");
        } else {
            setError(result.error || "Registration failed. Please try again.");
        }
    };

    const passwordStrength = (pw: string) => {
        if (pw.length === 0) return null;
        if (pw.length < 6) return { label: "Weak", color: "bg-red-400", text: "text-red-500", width: "w-1/4" };
        if (pw.length < 8 || !/[A-Z]/.test(pw) || !/[0-9]/.test(pw))
            return { label: "Fair", color: "bg-amber-400", text: "text-amber-500", width: "w-2/4" };
        if (pw.length >= 8 && /[A-Z]/.test(pw) && /[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw))
            return { label: "Strong", color: "bg-green-500", text: "text-green-600", width: "w-full" };
        return { label: "Good", color: "bg-blue-400", text: "text-blue-500", width: "w-3/4" };
    };

    const strength = passwordStrength(password);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                {/* Logo */}
                <Link href="/" className="flex items-center justify-center gap-2 mb-8">
                    <BookOpen className="w-8 h-8 text-primary" />
                    <span className="text-2xl font-extrabold text-white tracking-tight">
                        Kabadwal<span className="text-primary">book</span>
                    </span>
                </Link>

                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Create an account</h1>
                    <p className="text-sm text-gray-500 mb-6">
                        Join Kabadwalbook and start exploring
                    </p>

                    {error && (
                        <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm mb-5">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Full Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your full name"
                                    autoComplete="name"
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Email address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Min. 6 characters"
                                    autoComplete="new-password"
                                    className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    tabIndex={-1}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {strength && (
                                <div className="mt-2">
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className={cn("h-full rounded-full transition-all", strength.color, strength.width)} />
                                    </div>
                                    <p className={cn("text-xs mt-1", strength.text)}>{strength.label} password</p>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Repeat your password"
                                    autoComplete="new-password"
                                    className={cn(
                                        "w-full pl-10 pr-10 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all",
                                        confirmPassword && confirmPassword !== password
                                            ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                                            : "border-gray-200 focus:border-primary focus:ring-primary/20"
                                    )}
                                />
                                {confirmPassword && confirmPassword === password && (
                                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2 mt-1"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" /> Creating account...
                                </>
                            ) : (
                                "Create Account"
                            )}
                        </button>

                        <p className="text-[11px] text-gray-400 text-center leading-relaxed">
                            By creating an account you agree to our{" "}
                            <a href="#" className="text-primary hover:underline">Terms of Service</a>{" "}
                            and{" "}
                            <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
                        </p>
                    </form>

                    <div className="mt-5 text-center text-sm text-gray-500">
                        Already have an account?{" "}
                        <Link href="/login" className="text-primary font-semibold hover:underline">
                            Sign in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
