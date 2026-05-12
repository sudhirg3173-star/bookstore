"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
    Plus, Pencil, Trash2, Search, X, BookOpen, Award,
    ChevronLeft, ChevronRight, Loader2, AlertCircle, CheckCircle2,
    Upload, ImageIcon, LogOut, ArrowUpDown, ArrowUp, ArrowDown,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "books" | "standards";
type Row = Record<string, string> & { _index: number };

interface ApiResponse {
    headers: string[];
    rows: Row[];
}

// ── Friendly label mapping ────────────────────────────────────────────────────

const BOOK_LABELS: Record<string, string> = {
    Subject: "Subject",
    Title: "Title",
    Author: "Author",
    ISBN: "ISBN",
    Currency: "Currency",
    Price: "Price",
    Pages: "Pages",
    Publication_Year: "Publication Year",
    Category: "Category",
    Image_URL: "Image URL",
    Book_URL: "Book URL",
    Description: "Description",
    Updated_At: "Updated",
};

const STANDARD_LABELS: Record<string, string> = {
    "Standard Number": "Standard Number",
    "Standard Name": "Standard Name",
    YEAR: "Year",
    PUBLISHER: "Publisher",
    Currency: "Currency",
    Price: "Price",
    Image_URL: "Image URL",
    Description: "Description",
    Updated_At: "Updated",
};

const BOOK_TABLE_COLS = ["Title", "Author", "Subject", "Category", "Currency", "Price", "Publication_Year", "Updated_At"];
const STANDARD_TABLE_COLS = ["Standard Number", "Standard Name", "PUBLISHER", "YEAR", "Currency", "Price", "Updated_At"];

// All table columns are sortable
const SORTABLE_BOOK_COLS = new Set(BOOK_TABLE_COLS);
const SORTABLE_STANDARD_COLS = new Set(STANDARD_TABLE_COLS);

function formatDateTime(iso: string, fallback: string): string {
    const date = new Date(iso || fallback);
    try {
        return date.toLocaleString("en-IN", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit", hour12: true,
        });
    } catch {
        return iso || fallback;
    }
}

const PAGE_SIZE_OPTIONS = [10, 20, 50];

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

// ── Image Upload Widget ───────────────────────────────────────────────────────

function ImageUploadWidget({
    folder, nameValue, imageUrlField, existingUrl, onUploaded,
}: {
    folder: "books" | "standards";
    nameValue: string;            // ISBN or Standard Number
    imageUrlField: string | null; // CSV field to auto-fill, e.g. "Image_URL"
    existingUrl: string | null;   // current saved image path when editing
    onUploaded: (url: string, field: string | null) => void;
}) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

    const canUpload = nameValue.trim().length > 0;

    // Show existing image until the user replaces it
    const displayUrl = preview ?? uploadedUrl ?? existingUrl;

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setError(null);

        // Local preview
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);

        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("folder", folder);
            fd.append("name", nameValue.trim());

            const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
            const json = await res.json();

            if (!res.ok) {
                setError(json.error ?? "Upload failed");
                setPreview(null);
                return;
            }
            setUploadedUrl(json.url);
            onUploaded(json.url, imageUrlField);
        } catch {
            setError("Network error during upload");
            setPreview(null);
        } finally {
            setUploading(false);
            // Reset input so same file can be re-selected
            if (fileRef.current) fileRef.current.value = "";
        }
    };

    return (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Cover Image</p>

            <div className="flex items-start gap-4">
                {/* Preview box */}
                <div className="w-20 h-24 rounded-lg border border-gray-200 bg-white overflow-hidden flex items-center justify-center shrink-0">
                    {displayUrl ? (
                        <Image src={displayUrl} alt="preview" width={80} height={96} className="object-contain w-full h-full" unoptimized />
                    ) : (
                        <ImageIcon className="w-8 h-8 text-gray-300" />
                    )}
                </div>

                <div className="flex-1 space-y-2">
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={handleFile}
                        disabled={!canUpload || uploading}
                    />
                    <button
                        type="button"
                        disabled={!canUpload || uploading}
                        onClick={() => fileRef.current?.click()}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {uploading
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                            : <><Upload className="w-4 h-4" /> Choose image</>}
                    </button>

                    {!canUpload && (
                        <p className="text-xs text-amber-600">
                            Fill in the {folder === "books" ? "ISBN" : "Standard Number"} field first — it becomes the filename.
                        </p>
                    )}

                    {(uploadedUrl ?? existingUrl) && !error && (
                        <p className="text-xs text-green-600 break-all">Saved: {uploadedUrl ?? existingUrl}</p>
                    )}

                    {error && (
                        <p className="text-xs text-red-600">{error}</p>
                    )}

                    <p className="text-xs text-gray-400">JPEG · PNG · WebP · GIF · max 5 MB</p>
                </div>
            </div>
        </div>
    );
}

// ── SelectOrText ─────────────────────────────────────────────────────────────
// Renders a <select> with known options + an "Other…" escape hatch

function SelectOrText({
    options, value, onChange, placeholder,
}: {
    options: string[];
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}) {
    const OTHER = "__other__";

    // Track "other" mode independently so the text input stays visible while typing
    const [otherMode, setOtherMode] = useState<boolean>(
        () => value !== "" && !options.includes(value)
    );

    const selectVal = otherMode ? OTHER : (options.includes(value) ? value : "");

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (e.target.value === OTHER) {
            setOtherMode(true);
            onChange(""); // clear so the input starts blank
        } else {
            setOtherMode(false);
            onChange(e.target.value);
        }
    };

    return (
        <div className="space-y-2">
            <select
                value={selectVal}
                onChange={handleSelectChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <option value="">{placeholder ?? "— select —"}</option>
                {options.map((o) => (
                    <option key={o} value={o}>{o}</option>
                ))}
                <option value={OTHER}>Other…</option>
            </select>
            {otherMode && (
                <input
                    type="text"
                    placeholder="Type a custom value…"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                />
            )}
        </div>
    );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function Modal({
    title, headers, labels, row, tab, imageNameKey, dropdownOptions, onSave, onClose, saving,
}: {
    title: string;
    headers: string[];
    labels: Record<string, string>;
    row: Record<string, string> | null;
    tab: Tab;
    imageNameKey: string;
    dropdownOptions: Record<string, string[]>; // field → sorted unique values
    onSave: (data: Record<string, string>) => void;
    onClose: () => void;
    saving: boolean;
}) {
    const [form, setForm] = useState<Record<string, string>>(() => {
        const init: Record<string, string> = {};
        headers.forEach((h) => {
            let val = row?.[h] ?? "";
            // Strip currency symbols/spaces from Price so <input type="number"> can display it
            if (h === "Price" && val) {
                const numeric = val.replace(/[^0-9.-]/g, "");
                if (numeric) val = numeric;
            }
            init[h] = val;
        });
        // Default Currency to INR when adding a new record
        if (!row && !init["Currency"]) init["Currency"] = "INR";
        return init;
    });

    // Detect the Image_URL column — always present in books; injected for standards
    const imageUrlField = headers.includes("Image_URL") ? "Image_URL" : null;
    const folder = tab === "books" ? "books" : "standards";

    const handleUploaded = (url: string, field: string | null) => {
        if (field) setForm((f) => ({ ...f, [field]: url }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(form);
    };

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden flex-1">
                    <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

                        {/* Image upload widget — always at the top */}
                        <ImageUploadWidget
                            folder={folder}
                            nameValue={form[imageNameKey] ?? ""}
                            imageUrlField={imageUrlField}
                            existingUrl={imageUrlField ? (form[imageUrlField] ?? null) : null}
                            onUploaded={handleUploaded}
                        />

                        {/* Text / dropdown fields (Updated_At is auto-managed, not shown) */}
                        {headers.filter((h) => h !== "Updated_At").map((h) => (
                            <div key={h}>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                    {labels[h] ?? h}
                                </label>
                                {dropdownOptions[h] ? (
                                    <SelectOrText
                                        options={dropdownOptions[h]}
                                        value={form[h] ?? ""}
                                        onChange={(v) => setForm((f) => ({ ...f, [h]: v }))}
                                        placeholder={`— select ${labels[h] ?? h} —`}
                                    />
                                ) : h === "Price" ? (
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={form[h]}
                                        onChange={(e) => setForm((f) => ({ ...f, [h]: e.target.value }))}
                                    />
                                ) : h === "Description" ? (
                                    <textarea
                                        rows={4}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                        value={form[h]}
                                        onChange={(e) => setForm((f) => ({ ...f, [h]: e.target.value }))}
                                    />
                                ) : (
                                    <input
                                        type="text"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={form[h]}
                                        onChange={(e) => setForm((f) => ({ ...f, [h]: e.target.value }))}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors">
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────

function DeleteConfirm({ label, onConfirm, onClose, deleting }: {
    label: string;
    onConfirm: () => void;
    onClose: () => void;
    deleting: boolean;
}) {
    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4">
                <div className="flex justify-center">
                    <AlertCircle className="w-12 h-12 text-red-500" />
                </div>
                <h3 className="text-base font-semibold text-gray-800">Delete this entry?</h3>
                <p className="text-sm text-gray-500 break-words">
                    <span className="font-medium text-gray-700">&ldquo;{label}&rdquo;</span> will be permanently removed from the CSV.
                </p>
                <div className="flex gap-3 justify-center pt-2">
                    <button onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        Cancel
                    </button>
                    <button onClick={onConfirm} disabled={deleting}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors">
                        {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ControlCenterClient() {
    // Fixed fallback date shown for rows that have no Updated_At saved yet
    const defaultTimestamp = useRef("2026-05-10T12:00:00.000Z");

    const [tab, setTab] = useState<Tab>("books");
    const [data, setData] = useState<ApiResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortCol, setSortCol] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editRow, setEditRow] = useState<Row | null>(null);
    const [saving, setSaving] = useState(false);

    // Delete state
    const [deleteRow, setDeleteRow] = useState<Row | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Toast
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const apiBase = tab === "books" ? "/api/admin/books" : "/api/admin/standards";
    const labels = tab === "books" ? BOOK_LABELS : STANDARD_LABELS;
    const tableCols = tab === "books" ? BOOK_TABLE_COLS : STANDARD_TABLE_COLS;
    const nameKey = tab === "books" ? "Title" : "Standard Name";
    // The field whose value is used as the image filename
    const imageNameKey = tab === "books" ? "ISBN" : "Standard Number";

    // ── Dropdown options derived from loaded rows ────────────────────────────
    const dropdownOptions: Record<string, string[]> = useMemo(() => {
        if (!data) return {};
        const opts: Record<string, string[]> = {};
        const dropdownFields = tab === "books"
            ? ["Subject", "Category"]
            : ["PUBLISHER"];
        for (const field of dropdownFields) {
            const unique = Array.from(
                new Set(data.rows.map((r) => r[field]).filter(Boolean))
            ).sort();
            if (unique.length > 0) opts[field] = unique;
        }
        // Hardcoded currency dropdown for books and standards
        opts["Currency"] = ["INR", "USD", "GBP", "EUR"];
        return opts;
    }, [data, tab]);

    // ── Fetch ───────────────────────────────────────────────────────────────

    const fetchData = useCallback(async () => {
        setLoading(true);
        setData(null);
        try {
            const res = await fetch(apiBase, { cache: "no-store" });
            const json: ApiResponse = await res.json();
            setData(json);
        } catch {
            setToast({ message: "Failed to load data", type: "error" });
        } finally {
            setLoading(false);
        }
    }, [apiBase]);

    useEffect(() => {
        setSearch("");
        setPage(1);
        setPageSize(10);
        setSortCol(null);
        setSortDir("asc");
        fetchData();
    }, [fetchData]);

    // ── Sort handler ─────────────────────────────────────────────

    const sortableCols = tab === "books" ? SORTABLE_BOOK_COLS : SORTABLE_STANDARD_COLS;

    const handleSort = (col: string) => {
        if (!sortableCols.has(col)) return;
        if (sortCol === col) {
            setSortDir((d) => d === "asc" ? "desc" : "asc");
        } else {
            setSortCol(col);
            setSortDir("asc");
        }
        setPage(1);
    };

    // ── Filtered + sorted + paginated rows ─────────────────────────────

    const sorted = useMemo(() => {
        const rows = (data?.rows ?? []).filter((row) => {
            if (!search) return true;
            const q = search.toLowerCase();
            return tableCols.some((col) => (row[col] ?? "").toLowerCase().includes(q));
        });
        if (!sortCol) return rows;
        return [...rows].sort((a, b) => {
            const va = a[sortCol] ?? "";
            const vb = b[sortCol] ?? "";
            const cmp = va.localeCompare(vb);
            return sortDir === "asc" ? cmp : -cmp;
        });
    }, [data, search, sortCol, sortDir, tableCols]);

    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const pageRows = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // ── Save (create / update) ───────────────────────────────────────────────

    const handleSave = async (formData: Record<string, string>) => {
        setSaving(true);
        try {
            let res: Response;
            if (editRow !== null) {
                res = await fetch(`${apiBase}/${editRow._index}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                });
            } else {
                res = await fetch(apiBase, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                });
            }
            if (!res.ok) throw new Error();
            setToast({ message: editRow ? "Entry updated!" : "Entry created!", type: "success" });
            setModalOpen(false);
            setEditRow(null);
            await fetchData();
        } catch {
            setToast({ message: "Save failed. Please try again.", type: "error" });
        } finally {
            setSaving(false);
        }
    };

    // ── Delete ───────────────────────────────────────────────────────────────

    const handleDelete = async () => {
        if (!deleteRow) return;
        setDeleting(true);
        try {
            const res = await fetch(`${apiBase}/${deleteRow._index}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            setToast({ message: "Entry deleted.", type: "success" });
            setDeleteRow(null);
            await fetchData();
        } catch {
            setToast({ message: "Delete failed. Please try again.", type: "error" });
        } finally {
            setDeleting(false);
        }
    };

    // ── Render ───────────────────────────────────────────────────────────────
    const router = useRouter();

    const handleLogout = async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        router.push("/controlCenter/login");
        router.refresh();
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Page header */}
            <div className="bg-white border-b shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Control Center</h1>
                        <p className="text-sm text-gray-500 mt-1">Manage books and standards catalogue</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {/* Tabs */}
                <div className="flex gap-2 bg-white border rounded-xl p-1 w-fit shadow-sm">
                    {(["books", "standards"] as Tab[]).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all
                                ${tab === t
                                    ? "bg-blue-600 text-white shadow"
                                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"}`}
                        >
                            {t === "books" ? <BookOpen className="w-4 h-4" /> : <Award className="w-4 h-4" />}
                            {t === "books" ? "Books" : "Standards"}
                        </button>
                    ))}
                </div>

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder={`Search ${tab}…`}
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        onClick={() => { setEditRow(null); setModalOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        Add {tab === "books" ? "Book" : "Standard"}
                    </button>
                </div>

                {/* Table card */}
                <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-24">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        </div>
                    ) : sorted.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-3">
                            {tab === "books" ? <BookOpen className="w-10 h-10" /> : <Award className="w-10 h-10" />}
                            <p className="text-sm">No {tab} found{search ? " for your search" : ""}.</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-gray-50">
                                            {tableCols.map((col) => {
                                                const isSortable = sortableCols.has(col);
                                                const isActive = sortCol === col;
                                                return (
                                                    <th
                                                        key={col}
                                                        className={`text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap ${isSortable ? "cursor-pointer select-none hover:text-gray-700" : ""
                                                            }`}
                                                        onClick={() => isSortable && handleSort(col)}
                                                    >
                                                        <span className="inline-flex items-center gap-1">
                                                            {labels[col] ?? col}
                                                            {isSortable && (
                                                                isActive
                                                                    ? (sortDir === "asc"
                                                                        ? <ArrowUp className="w-3 h-3" />
                                                                        : <ArrowDown className="w-3 h-3" />)
                                                                    : <ArrowUpDown className="w-3 h-3 opacity-40" />
                                                            )}
                                                        </span>
                                                    </th>
                                                );
                                            })}
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {pageRows.map((row) => (
                                            <tr key={row._index} className="hover:bg-gray-50 transition-colors">
                                                {tableCols.map((col) => (
                                                    <td key={col} className="px-4 py-3 text-gray-700 max-w-[220px] truncate" title={row[col]}>
                                                        {col === "Updated_At"
                                                            ? <span className="text-gray-500 text-xs">{formatDateTime(row[col], defaultTimestamp.current)}</span>
                                                            : (row[col] || <span className="text-gray-300">—</span>)
                                                        }
                                                    </td>
                                                ))}
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => { setEditRow(row); setModalOpen(true); }}
                                                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" /> Edit
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteRow(row)}
                                                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" /> Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                    <span>Showing {Math.min((currentPage - 1) * pageSize + 1, sorted.length)}–{Math.min(currentPage * pageSize, sorted.length)} of {sorted.length}</span>
                                    <span className="text-gray-300">|</span>
                                    <span className="text-xs text-gray-400">Rows:</span>
                                    {PAGE_SIZE_OPTIONS.map((n) => (
                                        <button
                                            key={n}
                                            onClick={() => { setPageSize(n); setPage(1); }}
                                            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${pageSize === n
                                                    ? "bg-blue-600 text-white"
                                                    : "hover:bg-gray-200 text-gray-600"
                                                }`}
                                        >
                                            {n}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40 transition-colors"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="px-2 font-medium text-gray-700">{currentPage} / {totalPages}</span>
                                    <button
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40 transition-colors"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Add / Edit Modal */}
            {modalOpen && data && (() => {
                // Build modal headers with Currency right after Price and Image_URL after Currency
                const STANDARDS_FLOAT = ["Currency", "Image_URL"];
                const baseHeaders = data.headers.filter((h) => !STANDARDS_FLOAT.includes(h));
                const priceIdx = baseHeaders.indexOf("Price");
                const insertAt = priceIdx >= 0 ? priceIdx + 1 : baseHeaders.length;
                const modalHeaders = tab === "standards"
                    ? [...baseHeaders.slice(0, insertAt), "Currency", "Image_URL", ...baseHeaders.slice(insertAt)]
                    : data.headers;
                return (
                    <Modal
                        title={editRow ? `Edit ${tab === "books" ? "Book" : "Standard"}` : `Add ${tab === "books" ? "Book" : "Standard"}`}
                        headers={modalHeaders}
                        labels={labels}
                        row={editRow}
                        tab={tab}
                        imageNameKey={imageNameKey}
                        dropdownOptions={dropdownOptions}
                        onSave={handleSave}
                        onClose={() => { setModalOpen(false); setEditRow(null); }}
                        saving={saving}
                    />
                );
            })()}

            {/* Delete Confirm */}
            {deleteRow && (
                <DeleteConfirm
                    label={deleteRow[nameKey] ?? String(deleteRow._index)}
                    onConfirm={handleDelete}
                    onClose={() => setDeleteRow(null)}
                    deleting={deleting}
                />
            )}

            {/* Toast */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
