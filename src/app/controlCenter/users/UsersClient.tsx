"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Search, Pencil, Trash2, X, Loader2, AlertCircle,
    CheckCircle2, ChevronLeft, ChevronRight, Users, LogOut,
    BookOpen, ShoppingBag, Store,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Role = "buyer" | "seller" | "author";

interface UserRow {
    id: string;
    name: string;
    email: string;
    role: Role;
    createdAt: string;
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
    useEffect(() => {
        const t = setTimeout(onClose, 3500);
        return () => clearTimeout(t);
    }, [onClose]);

    return (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg text-sm font-medium
            ${type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
            {type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {message}
            <button onClick={onClose}><X className="w-4 h-4" /></button>
        </div>
    );
}

// ── Role Badge ────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
    const map: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
        buyer: { label: "Buyer", className: "bg-blue-50 text-blue-700 border-blue-100", icon: <ShoppingBag className="w-3 h-3" /> },
        seller: { label: "Seller", className: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: <Store className="w-3 h-3" /> },
        author: { label: "Author", className: "bg-purple-50 text-purple-700 border-purple-100", icon: <BookOpen className="w-3 h-3" /> },
    };
    const meta = map[role] ?? { label: role, className: "bg-gray-50 text-gray-600 border-gray-100", icon: null };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${meta.className}`}>
            {meta.icon}{meta.label}
        </span>
    );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

function EditModal({
    user,
    onClose,
    onSaved,
}: {
    user: UserRow;
    onClose: () => void;
    onSaved: (uid: string, updates: { name: string; role: Role }) => void;
}) {
    const [name, setName] = useState(user.name);
    const [role, setRole] = useState<Role>(["buyer", "seller", "author"].includes(user.role) ? user.role as Role : "buyer");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const res = await fetch(`/api/admin/users/${user.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim(), role }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.error ?? "Failed to update");
                return;
            }
            onSaved(user.id, { name: name.trim(), role });
            onClose();
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-gray-900">Edit User</h2>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Editable fields */}
                <div className="space-y-4 mb-5">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                            Full Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">Email</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">Member Since</p>
                        <p className="text-sm text-gray-500">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                        </p>
                    </div>
                </div>

                <div className="border-t pt-5">
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                        Role
                    </label>
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as Role)}
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="buyer">Buyer</option>
                        <option value="seller">Seller</option>
                        <option value="author">Author</option>
                    </select>
                </div>

                {error && (
                    <div className="flex items-center gap-2 mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />{error}
                    </div>
                )}

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
                    >
                        {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Delete Confirm ────────────────────────────────────────────────────────────

function DeleteConfirm({
    user,
    onClose,
    onDeleted,
}: {
    user: UserRow;
    onClose: () => void;
    onDeleted: (uid: string) => void;
}) {
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDelete = async () => {
        setDeleting(true);
        setError(null);
        try {
            const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.error ?? "Failed to delete");
                return;
            }
            onDeleted(user.id);
            onClose();
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <Trash2 className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-gray-900">Delete User</h2>
                        <p className="text-sm text-gray-500">This action cannot be undone.</p>
                    </div>
                </div>
                <p className="text-sm text-gray-700 mb-5">
                    Are you sure you want to delete <span className="font-semibold">{user.name || user.email}</span>?
                    Their account, profile, and wishlist will be permanently removed.
                </p>

                {error && (
                    <div className="flex items-center gap-2 mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />{error}
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors"
                    >
                        {deleting ? <><Loader2 className="w-4 h-4 animate-spin" />Deleting…</> : "Delete"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function UsersClient() {
    const router = useRouter();
    const [users, setUsers] = useState<UserRow[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [editUser, setEditUser] = useState<UserRow | null>(null);
    const [deleteUser, setDeleteUser] = useState<UserRow | null>(null);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const LIMIT = 10;
    const totalPages = Math.max(1, Math.ceil(total / LIMIT));

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
        return () => clearTimeout(t);
    }, [search]);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), search: debouncedSearch });
            const res = await fetch(`/api/admin/users?${params}`);
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setUsers(data.users ?? []);
            setTotal(data.total ?? 0);
        } catch {
            setToast({ message: "Failed to load users", type: "error" });
        } finally {
            setLoading(false);
        }
    }, [page, debouncedSearch]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleLogout = async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        router.push("/controlCenter/login");
        router.refresh();
    };

    const handleRoleSaved = (uid: string, updates: { name: string; role: Role }) => {
        setUsers((prev) => prev.map((u) => u.id === uid ? { ...u, ...updates } : u));
        setToast({ message: "User updated successfully", type: "success" });
    };

    const handleDeleted = (uid: string) => {
        setUsers((prev) => prev.filter((u) => u.id !== uid));
        setTotal((t) => t - 1);
        setToast({ message: "User deleted successfully", type: "success" });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Control Center</h1>
                        <p className="text-sm text-gray-500 mt-1">Manage users</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />Sign Out
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {/* Nav tabs */}
                <div className="flex gap-2 bg-white border rounded-xl p-1 w-fit shadow-sm">
                    <button
                        onClick={() => router.push("/controlCenter")}
                        className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all"
                    >
                        <BookOpen className="w-4 h-4" />Catalogue
                    </button>
                    <button
                        className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white shadow transition-all"
                    >
                        <Users className="w-4 h-4" />Users
                    </button>
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between gap-4">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {search && (
                            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                            </button>
                        )}
                    </div>
                    <p className="text-sm text-gray-500 shrink-0">{total} user{total !== 1 ? "s" : ""}</p>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    {["Name", "Email", "Role", "Member Since", "Actions"].map((h) => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="py-16 text-center">
                                            <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-16 text-center text-gray-400">
                                            <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                            No users found
                                        </td>
                                    </tr>
                                ) : users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                    {(user.name || user.email).charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-medium text-gray-900 truncate max-w-[160px]">{user.name || "—"}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 truncate max-w-[200px]">{user.email}</td>
                                        <td className="px-4 py-3"><RoleBadge role={user.role} /></td>
                                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                                            {user.createdAt
                                                ? new Date(user.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                                                : "—"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setEditUser(user)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />Edit
                                                </button>
                                                <button
                                                    onClick={() => setDeleteUser(user)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-4 py-3 border-t flex items-center justify-between bg-gray-50">
                            <p className="text-xs text-gray-500">
                                Page {page} of {totalPages} · {total} results
                            </p>
                            <div className="flex items-center gap-1">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage((p) => p - 1)}
                                    className="p-1.5 rounded-lg border bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                                    .reduce<(number | "…")[]>((acc, p, i, arr) => {
                                        if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                                        acc.push(p);
                                        return acc;
                                    }, [])
                                    .map((p, i) =>
                                        p === "…" ? (
                                            <span key={`e${i}`} className="px-2 text-gray-400 text-sm">…</span>
                                        ) : (
                                            <button
                                                key={p}
                                                onClick={() => setPage(p as number)}
                                                className={`w-8 h-8 text-xs rounded-lg border transition-colors
                                                    ${page === p ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                                            >
                                                {p}
                                            </button>
                                        )
                                    )}
                                <button
                                    disabled={page === totalPages}
                                    onClick={() => setPage((p) => p + 1)}
                                    className="p-1.5 rounded-lg border bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {editUser && (
                <EditModal user={editUser} onClose={() => setEditUser(null)} onSaved={handleRoleSaved} />
            )}
            {deleteUser && (
                <DeleteConfirm user={deleteUser} onClose={() => setDeleteUser(null)} onDeleted={handleDeleted} />
            )}

            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
