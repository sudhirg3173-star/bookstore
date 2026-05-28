"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
    Plus, Pencil, Trash2, Search, X, BookOpen, Award,
    ChevronLeft, ChevronRight, Loader2, AlertCircle, CheckCircle2,
    Upload, ImageIcon, LogOut, ArrowUpDown, ArrowUp, ArrowDown,
    FileUp, CheckCircle, Info, Users, Eye, EyeOff,
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
    Discount: "Discount (%)",
    Pages: "Pages",
    Publication_Year: "Publication Year",
    Category: "Category",
    Image_URL: "Image URL",
    Book_URL: "Book URL",
    Description: "Description",
    Visible: "Visible",
    Updated_At: "Updated",
};

const STANDARD_LABELS: Record<string, string> = {
    "Standard Number": "Standard Number",
    "Standard Name": "Standard Name",
    YEAR: "Year",
    PUBLISHER: "Publisher",
    Currency: "Currency",
    Price: "Price",
    Discount: "Discount (%)",
    Image_URL: "Image URL",
    Description: "Description",
    Visible: "Visible",
    Updated_At: "Updated",
};

const BOOK_TABLE_COLS = ["Title", "Author", "Subject", "Category", "Currency", "Price", "Publication_Year", "Visible", "Updated_At"];
const STANDARD_TABLE_COLS = ["Standard Number", "Standard Name", "PUBLISHER", "YEAR", "Currency", "Price", "Visible", "Updated_At"];

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
        // Default Discount to 0
        if (!init["Discount"]) init["Discount"] = "0";
        // Default Visible: use saved value if present;
        // for new entries default to true; for existing entries without Visible, infer from price
        const savedVisible = row?.["Visible"] ?? "";
        if (!savedVisible) {
            if (!row) {
                // New entry — visible by default
                init["Visible"] = "true";
            } else {
                const priceNum = parseFloat(init["Price"] || "0");
                init["Visible"] = priceNum > 0 ? "true" : "false";
            }
        } else {
            init["Visible"] = savedVisible;
        }
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

                        {/* Text / dropdown fields (Updated_At and Visible are handled separately) */}
                        {headers.filter((h) => h !== "Updated_At" && h !== "Visible").map((h) => (
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
                                ) : h === "Discount" ? (
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="1"
                                            placeholder="0"
                                            className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={form[h]}
                                            onChange={(e) => {
                                                const v = Math.min(100, Math.max(0, parseInt(e.target.value || "0", 10)));
                                                setForm((f) => ({ ...f, [h]: String(v) }));
                                            }}
                                        />
                                        <span className="text-sm text-gray-500">%</span>
                                        {parseInt(form[h] || "0", 10) > 0 && (
                                            <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-sm">
                                                -{form[h]}% OFF
                                            </span>
                                        )}
                                    </div>
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

                        {/* Visibility toggle */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                Visibility
                            </label>
                            <button
                                type="button"
                                onClick={() => setForm((f) => ({ ...f, Visible: f["Visible"] === "false" ? "true" : "false" }))}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors
                                    ${form["Visible"] === "false"
                                        ? "border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100"
                                        : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}
                            >
                                {form["Visible"] === "false"
                                    ? <><EyeOff className="w-4 h-4" /> Hidden from shop</>
                                    : <><Eye className="w-4 h-4" /> Visible in shop</>
                                }
                            </button>
                            {form["Visible"] === "false" && parseFloat(form["Price"] || "0") === 0 && (
                                <p className="text-xs text-amber-600 mt-1.5">Auto-hidden because price is ₹0</p>
                            )}
                        </div>
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

// ── CsvUploadModal ───────────────────────────────────────────────────────────

type CsvUploadStep = "select" | "validating" | "preview" | "importing" | "done";

interface CsvValidationResult {
    valid: boolean;
    hasDupKey: boolean;
    differences: {
        missingInUpload: string[];
        extraInUpload: string[];
        matchingFields: string[];
    };
    stats: {
        totalRows: number;
        newRows: number;
        updatedRows: number;
    };
}

interface CsvImportResult {
    success: boolean;
    stats: {
        added: number;
        updated: number;
        imagesDownloaded: number;
        imagesFailed: number;
    };
}

function CsvUploadModal({
    tab, onClose, onSuccess,
}: {
    tab: Tab;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [step, setStep] = useState<CsvUploadStep>("select");
    const [file, setFile] = useState<File | null>(null);
    const [validation, setValidation] = useState<CsvValidationResult | null>(null);
    const [importResult, setImportResult] = useState<CsvImportResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const typeName = tab === "books" ? "Books" : "Standards";

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] ?? null;
        setFile(f);
        setValidation(null);
        setError(null);
        setStep("select");
        if (fileRef.current) fileRef.current.value = "";
    };

    const handleValidate = async () => {
        if (!file) return;
        setStep("validating");
        setError(null);
        const fd = new FormData();
        fd.append("file", file);
        fd.append("type", tab);
        fd.append("confirmed", "false");
        try {
            const res = await fetch("/api/admin/upload-csv", { method: "POST", body: fd });
            const json = await res.json();
            if (!res.ok || !json.valid) {
                setError(json.error ?? "Validation failed");
                setStep("select");
                return;
            }
            setValidation(json as CsvValidationResult);
            setStep("preview");
        } catch {
            setError("Network error during validation");
            setStep("select");
        }
    };

    const handleImport = async () => {
        if (!file) return;
        setStep("importing");
        setError(null);
        const fd = new FormData();
        fd.append("file", file);
        fd.append("type", tab);
        fd.append("confirmed", "true");
        try {
            const res = await fetch("/api/admin/upload-csv", { method: "POST", body: fd });
            const json = await res.json();
            if (!res.ok || !json.success) {
                setError(json.error ?? "Import failed");
                setStep("preview");
                return;
            }
            setImportResult(json as CsvImportResult);
            setStep("done");
            onSuccess();
        } catch {
            setError("Network error during import");
            setStep("preview");
        }
    };

    const hasDiffs = validation
        ? validation.differences.missingInUpload.length > 0 || validation.differences.extraInUpload.length > 0
        : false;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div className="flex items-center gap-2">
                        <FileUp className="w-5 h-5 text-blue-600" />
                        <h2 className="text-base font-semibold text-gray-800">Upload {typeName} CSV</h2>
                    </div>
                    <button onClick={onClose} disabled={step === "validating" || step === "importing"}
                        className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                    {/* File picker */}
                    {step !== "done" && (
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Select CSV File</p>
                            <div
                                onClick={() => fileRef.current?.click()}
                                className="border-2 border-dashed border-gray-200 rounded-xl px-4 py-6 flex flex-col items-center gap-2 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                            >
                                <FileUp className="w-8 h-8 text-gray-300" />
                                {file
                                    ? <p className="text-sm font-medium text-blue-700 text-center break-all">{file.name}</p>
                                    : <p className="text-sm text-gray-400">Click to choose a .csv file</p>
                                }
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept=".csv,text/csv"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>
                    )}

                    {/* Validation error */}
                    {error && (
                        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Validation preview */}
                    {step === "preview" && validation && (
                        <div className="space-y-4">
                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { label: "Total Rows", value: validation.stats.totalRows, color: "text-gray-700" },
                                    { label: "New", value: validation.stats.newRows, color: "text-green-600" },
                                    { label: "Updates", value: validation.stats.updatedRows, color: "text-blue-600" },
                                ].map(({ label, value, color }) => (
                                    <div key={label} className="bg-gray-50 rounded-xl p-3 text-center border">
                                        <p className={`text-2xl font-bold ${color}`}>{value}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Structure differences */}
                            {hasDiffs ? (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
                                    <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
                                        <Info className="w-4 h-4" />
                                        Structure differences detected
                                    </div>

                                    {validation.differences.missingInUpload.length > 0 && (
                                        <div>
                                            <p className="text-xs font-semibold text-gray-600 mb-1">
                                                Fields in main CSV <span className="text-amber-700">not present</span> in your upload
                                                <span className="font-normal text-gray-500"> — existing values will be kept</span>
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {validation.differences.missingInUpload.map(f => (
                                                    <span key={f} className="inline-block bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full border border-amber-200">{f}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {validation.differences.extraInUpload.length > 0 && (
                                        <div>
                                            <p className="text-xs font-semibold text-gray-600 mb-1">
                                                Fields in your upload <span className="text-gray-500">not in main CSV</span>
                                                <span className="font-normal text-gray-500"> — will be ignored</span>
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {validation.differences.extraInUpload.map(f => (
                                                    <span key={f} className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full border border-gray-200">{f}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <p className="text-xs text-amber-700">
                                        Only the <strong>{validation.differences.matchingFields.length}</strong> matching field{validation.differences.matchingFields.length !== 1 ? "s" : ""} will be imported.
                                        Confirm below to proceed.
                                    </p>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2.5 text-sm text-green-700">
                                    <CheckCircle className="w-4 h-4 shrink-0" />
                                    CSV structure matches perfectly — all fields will be imported.
                                </div>
                            )}

                            {!validation.hasDupKey && (
                                <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2.5 text-xs text-blue-700">
                                    <Info className="w-4 h-4 mt-0.5 shrink-0" />
                                    The deduplication key column was not found in your CSV — all rows will be appended as new entries.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Importing spinner */}
                    {step === "importing" && (
                        <div className="flex flex-col items-center gap-3 py-6 text-gray-500">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                            <p className="text-sm">Importing data and downloading images…</p>
                            <p className="text-xs text-gray-400">This may take a moment for large files.</p>
                        </div>
                    )}

                    {/* Done */}
                    {step === "done" && importResult && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-green-700 font-semibold">
                                <CheckCircle2 className="w-5 h-5" />
                                Import completed successfully!
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: "Records Added", value: importResult.stats.added, color: "text-green-600" },
                                    { label: "Records Updated", value: importResult.stats.updated, color: "text-blue-600" },
                                    { label: "Images Downloaded", value: importResult.stats.imagesDownloaded, color: "text-purple-600" },
                                    { label: "Image Failures", value: importResult.stats.imagesFailed, color: importResult.stats.imagesFailed > 0 ? "text-red-600" : "text-gray-400" },
                                ].map(({ label, value, color }) => (
                                    <div key={label} className="bg-gray-50 rounded-xl p-3 text-center border">
                                        <p className={`text-2xl font-bold ${color}`}>{value}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
                    {step === "done" ? (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Close
                        </button>
                    ) : step === "preview" ? (
                        <>
                            <button
                                onClick={() => { setStep("select"); setValidation(null); }}
                                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleImport}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Upload className="w-4 h-4" />
                                Confirm &amp; Import
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={onClose}
                                disabled={step === "validating"}
                                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleValidate}
                                disabled={!file || step === "validating"}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {step === "validating"
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Validating…</>
                                    : <><FileUp className="w-4 h-4" /> Validate &amp; Preview</>
                                }
                            </button>
                        </>
                    )}
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

    // CSV upload modal
    const [csvModalOpen, setCsvModalOpen] = useState(false);

    // Toast
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    // Visibility toggle loading state
    const [togglingIndex, setTogglingIndex] = useState<number | null>(null);

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

    // ── Visibility toggle ─────────────────────────────────────────────────────

    const handleToggleVisibility = async (row: Row) => {
        const current = row["Visible"];
        const newVisible = current === "false" ? "true" : "false";
        // Optimistic update
        setData((d) => d ? { ...d, rows: d.rows.map((r) => r._index === row._index ? { ...r, Visible: newVisible } : r) } : d);
        setTogglingIndex(row._index);
        try {
            const res = await fetch(`${apiBase}/${row._index}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ Visible: newVisible }),
            });
            if (!res.ok) throw new Error();
            setToast({ message: newVisible === "true" ? "Now visible in shop" : "Hidden from shop", type: "success" });
        } catch {
            // Revert on failure
            setData((d) => d ? { ...d, rows: d.rows.map((r) => r._index === row._index ? { ...r, Visible: current } : r) } : d);
            setToast({ message: "Failed to update visibility", type: "error" });
        } finally {
            setTogglingIndex(null);
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
                    <button
                        onClick={() => router.push("/controlCenter/users")}
                        className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all"
                    >
                        <Users className="w-4 h-4" />Users
                    </button>
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
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => setCsvModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            <FileUp className="w-4 h-4" />
                            Upload CSV
                        </button>
                        <button
                            onClick={() => { setEditRow(null); setModalOpen(true); }}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Add {tab === "books" ? "Book" : "Standard"}
                        </button>
                    </div>
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
                                                    <td key={col} className={`px-4 py-3 ${col === "Visible" ? "" : "text-gray-700 max-w-[220px] truncate"}`} title={col !== "Visible" ? (row[col] ?? "") : undefined}>
                                                        {col === "Visible" ? (
                                                            <button
                                                                onClick={() => handleToggleVisibility(row)}
                                                                disabled={togglingIndex === row._index}
                                                                title={row["Visible"] === "false" ? "Hidden — click to show" : "Visible — click to hide"}
                                                                className="p-1 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
                                                            >
                                                                {togglingIndex === row._index
                                                                    ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                                                    : row["Visible"] === "false"
                                                                        ? <EyeOff className="w-4 h-4 text-gray-400" />
                                                                        : <Eye className="w-4 h-4 text-emerald-500" />
                                                                }
                                                            </button>
                                                        ) : col === "Updated_At"
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
                const ensureDiscount = (hdrs: string[]): string[] => {
                    if (hdrs.includes("Discount")) return hdrs;
                    const idx = hdrs.indexOf("Price");
                    const at = idx >= 0 ? idx + 1 : hdrs.length;
                    return [...hdrs.slice(0, at), "Discount", ...hdrs.slice(at)];
                };
                const STANDARDS_FLOAT = ["Currency", "Image_URL"];
                const baseHeaders = data.headers.filter((h) => !STANDARDS_FLOAT.includes(h));
                const priceIdx = baseHeaders.indexOf("Price");
                const insertAt = priceIdx >= 0 ? priceIdx + 1 : baseHeaders.length;
                const modalHeaders = tab === "standards"
                    ? ensureDiscount([...baseHeaders.slice(0, insertAt), "Currency", "Image_URL", ...baseHeaders.slice(insertAt)])
                    : ensureDiscount(data.headers);
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

            {/* CSV Upload Modal */}
            {csvModalOpen && (
                <CsvUploadModal
                    tab={tab}
                    onClose={() => setCsvModalOpen(false)}
                    onSuccess={() => {
                        setCsvModalOpen(false);
                        fetchData();
                        setToast({ message: "CSV imported successfully!", type: "success" });
                    }}
                />
            )}

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
