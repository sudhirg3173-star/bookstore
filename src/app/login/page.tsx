"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, BookOpen, Mail, Lock, AlertCircle, Loader2, CheckCircle2, X } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
    const router = useRouter();
    const login = useAuthStore((s) => s.login);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Forgot password state
    const [showForgot, setShowForgot] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotError, setForgotError] = useState("");
    const [forgotSuccess, setForgotSuccess] = useState(false);

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setForgotError("");
        if (!forgotEmail.trim()) {
            setForgotError("Please enter your email address.");
            return;
        }
        setForgotLoading(true);
        try {
            await sendPasswordResetEmail(getFirebaseAuth(), forgotEmail.trim());
            setForgotSuccess(true);
        } catch (err: unknown) {
            const code = (err as { code?: string }).code;
            if (code === "auth/user-not-found") {
                setForgotError("No account found with this email address.");
            } else if (code === "auth/invalid-email") {
                setForgotError("Please enter a valid email address.");
            } else {
                setForgotError("Failed to send reset email. Please try again.");
            }
        } finally {
            setForgotLoading(false);
        }
    };

    const closeForgot = () => {
        setShowForgot(false);
        setForgotEmail("");
        setForgotError("");
        setForgotSuccess(false);
    };

    useEffect(() => {
        if (isAuthenticated) router.replace("/account");
    }, [isAuthenticated, router]);

    if (isAuthenticated) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!email.trim() || !password) {
            setError("Please fill in all fields.");
            return;
        }

        setLoading(true);
        const result = await login(email, password);
        setLoading(false);

        if (result.success) {
            router.push("/account");
        } else {
            setError(result.error || "Login failed. Please try again.");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex items-center justify-center px-4 py-12">
            {/* Forgot Password Modal */}
            {showForgot && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
                    <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-7 relative">
                        <button
                            onClick={closeForgot}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-xl font-extrabold text-gray-900 mb-1">Reset password</h2>
                        <p className="text-sm text-gray-500 mb-6">Enter your email and we&apos;ll send you a recovery link.</p>

                        {forgotSuccess ? (
                            <div className="flex flex-col items-center gap-3 py-4 text-center">
                                <CheckCircle2 className="w-10 h-10 text-green-500" />
                                <p className="text-sm font-medium text-gray-800">Recovery email sent!</p>
                                <p className="text-xs text-gray-500">Check your inbox at <span className="font-semibold">{forgotEmail}</span> and follow the link to reset your password.</p>
                                <button onClick={closeForgot} className="mt-2 text-sm text-primary font-semibold hover:underline">Back to login</button>
                            </div>
                        ) : (
                            <form onSubmit={handleForgotPassword} className="space-y-4" noValidate>
                                {forgotError && (
                                    <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm">
                                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                        {forgotError}
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="email"
                                            value={forgotEmail}
                                            onChange={(e) => setForgotEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            autoComplete="email"
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={forgotLoading}
                                    className="w-full bg-primary hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                                >
                                    {forgotLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : "Send recovery email"}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
            <div className="w-full max-w-md">
                {/* Logo */}
                <Link href="/" className="flex items-center justify-center gap-2 mb-8">
                    <BookOpen className="w-8 h-8 text-primary" />
                    <span className="text-2xl font-extrabold text-white tracking-tight">
                        Kabdwal<span className="text-primary">book</span>
                    </span>
                </Link>

                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Welcome back</h1>
                    <p className="text-sm text-gray-500 mb-7">
                        Sign in to your Kabdwalbook account
                    </p>

                    {error && (
                        <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm mb-5">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <button type="button" onClick={() => setShowForgot(true)} className="text-xs text-primary hover:underline">
                                    Forgot password?
                                </button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
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
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" /> Signing in…
                                </>
                            ) : (
                                "Sign In"
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-500">
                        Don&apos;t have an account?{" "}
                        <Link
                            href="/register"
                            className="text-primary font-semibold hover:underline"
                        >
                            Create one
                        </Link>
                    </div>
                </div>

                {/* Demo hint */}
                <p className="text-center text-xs text-white/40 mt-5">
                    New here?{" "}
                    <Link href="/register" className="text-white/60 hover:text-white underline">
                        Register an account
                    </Link>{" "}
                    to get started.
                </p>
            </div>
        </div>
    );
}
