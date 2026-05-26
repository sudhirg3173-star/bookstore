import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { BOOKS_CSV_PATH, STANDARDS_CSV_PATH, readCSV, writeCSV } from "@/lib/adminCsv";
import { invalidateBooksCache } from "@/lib/books";
import { invalidateStandardsCache } from "@/lib/standards";

export const dynamic = "force-dynamic";

// ── Constants ─────────────────────────────────────────────────────────────────

/** Primary key used for deduplication per type */
const DUPLICATE_KEYS: Record<string, string> = {
    books: "ISBN",
    standards: "Standard Number",
};

const CSV_PATHS: Record<string, string> = {
    books: BOOKS_CSV_PATH,
    standards: STANDARDS_CSV_PATH,
};

const IMAGE_DIRS: Record<string, string> = {
    books: path.join(process.cwd(), "public", "images", "books"),
    standards: path.join(process.cwd(), "public", "images", "standards"),
};

// ── CSV parser (string → rows) ─────────────────────────────────────────────

function parseCSVFromString(content: string): { headers: string[]; rows: Record<string, string>[] } {
    // Strip UTF-8 BOM
    if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);

    const allRows: string[][] = [];
    let currentRow: string[] = [];
    let field = "";
    let inQuotes = false;

    for (let i = 0; i < content.length; i++) {
        const ch = content[i];
        const next = content[i + 1];
        if (inQuotes) {
            if (ch === '"' && next === '"') { field += '"'; i++; }
            else if (ch === '"') { inQuotes = false; }
            else { field += ch; }
        } else {
            if (ch === '"') { inQuotes = true; }
            else if (ch === ',') { currentRow.push(field); field = ""; }
            else if (ch === '\r' && next === '\n') {
                currentRow.push(field); field = "";
                if (currentRow.some(v => v.trim())) allRows.push(currentRow);
                currentRow = []; i++;
            } else if (ch === '\n') {
                currentRow.push(field); field = "";
                if (currentRow.some(v => v.trim())) allRows.push(currentRow);
                currentRow = [];
            } else { field += ch; }
        }
    }
    if (currentRow.length > 0 || field) {
        currentRow.push(field);
        if (currentRow.some(v => v.trim())) allRows.push(currentRow);
    }

    if (allRows.length < 2) return { headers: [], rows: [] };

    const headers = allRows[0];
    const rows = allRows.slice(1)
        .map(values => {
            const obj: Record<string, string> = {};
            headers.forEach((h, i) => { obj[h] = values[i] ?? ""; });
            return obj;
        })
        .filter(row => Object.values(row).some(v => v.trim()));

    return { headers, rows };
}

// ── Image downloader ──────────────────────────────────────────────────────────

async function downloadImage(
    url: string,
    destDir: string,
    filenameStem: string,
): Promise<{ success: boolean; savedPath?: string; error?: string }> {
    try {
        const controller = new AbortController();
        const timerId = setTimeout(() => controller.abort(), 15_000);
        try {
            const res = await fetch(url, { signal: controller.signal });
            if (!res.ok) return { success: false, error: `HTTP ${res.status}` };

            const contentType = res.headers.get("content-type") ?? "";
            let ext = ".jpg";
            if (contentType.includes("png")) ext = ".png";
            else if (contentType.includes("webp")) ext = ".webp";
            else if (contentType.includes("gif")) ext = ".gif";
            else {
                // Fall back to extension in URL (before query string)
                const urlExt = url.split("?")[0].split(".").pop()?.toLowerCase();
                if (urlExt && ["jpg", "jpeg", "png", "webp", "gif"].includes(urlExt)) {
                    ext = `.${urlExt === "jpeg" ? "jpg" : urlExt}`;
                }
            }

            fs.mkdirSync(destDir, { recursive: true });
            const destPath = path.join(destDir, filenameStem + ext);
            const buffer = Buffer.from(await res.arrayBuffer());
            fs.writeFileSync(destPath, buffer);

            const folder = path.basename(destDir);
            return { success: true, savedPath: `/images/${folder}/${filenameStem}${ext}` };
        } finally {
            clearTimeout(timerId);
        }
    } catch (err) {
        return { success: false, error: String(err) };
    }
}

// ── Header normalisation helper ───────────────────────────────────────────────

const normalise = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, "");

// ── Route handler ─────────────────────────────────────────────────────────────

/**
 * POST /api/admin/upload-csv
 *
 * Multipart form fields:
 *   file      — CSV file
 *   type      — "books" | "standards"
 *   confirmed — "true" to execute the import; default "false" (validation only)
 *
 * Phase 1 (confirmed=false) — returns structure diff + preview stats.
 * Phase 2 (confirmed=true)  — merges CSV, downloads images, writes files.
 */
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const type = formData.get("type") as string | null;
        const confirmed = formData.get("confirmed") === "true";

        if (!file || !type) {
            return NextResponse.json({ error: "Missing file or type" }, { status: 400 });
        }
        if (!["books", "standards"].includes(type)) {
            return NextResponse.json({ error: "type must be 'books' or 'standards'" }, { status: 400 });
        }

        const content = await file.text();
        const { headers: uploadHeaders, rows: uploadRows } = parseCSVFromString(content);

        if (uploadHeaders.length === 0 || uploadRows.length === 0) {
            return NextResponse.json({ error: "Uploaded CSV is empty or contains no data rows" }, { status: 400 });
        }

        const csvPath = CSV_PATHS[type];
        const { headers: mainHeaders, rows: mainRows } = readCSV(csvPath);
        const dupKey = DUPLICATE_KEYS[type];

        // ── Build header mapping ────────────────────────────────────────────

        // normalized → original header for each side
        const uploadNorm = new Map<string, string>();
        uploadHeaders.forEach(h => uploadNorm.set(normalise(h), h));

        const mainNorm = new Map<string, string>();
        mainHeaders.forEach(h => mainNorm.set(normalise(h), h));

        // Fields in main not present in upload (will keep existing values)
        const missingInUpload = mainHeaders.filter(h => !uploadNorm.has(normalise(h)));
        // Fields in upload not present in main (will be ignored)
        const extraInUpload = uploadHeaders.filter(h => !mainNorm.has(normalise(h)));
        // Fields present in both (these will be merged)
        const matchingFields = mainHeaders.filter(h => uploadNorm.has(normalise(h)));

        // Main header → corresponding upload header (for value lookup)
        const fieldMap: Record<string, string> = {};
        matchingFields.forEach(mh => {
            fieldMap[mh] = uploadNorm.get(normalise(mh))!;
        });

        const hasDupKey = matchingFields.includes(dupKey);

        // ── Phase 1: validation only ────────────────────────────────────────

        if (!confirmed) {
            const mainKeyMap = new Map<string, number>();
            if (hasDupKey) {
                mainRows.forEach((row, i) => {
                    const k = (row[dupKey] ?? "").trim();
                    if (k) mainKeyMap.set(k.toLowerCase(), i);
                });
            }

            let newRowCount = 0;
            let updatedRowCount = 0;
            uploadRows.forEach(row => {
                const keyVal = (row[fieldMap[dupKey] ?? dupKey] ?? "").trim();
                if (hasDupKey && keyVal && mainKeyMap.has(keyVal.toLowerCase())) {
                    updatedRowCount++;
                } else {
                    newRowCount++;
                }
            });

            return NextResponse.json({
                valid: true,
                hasDupKey,
                differences: { missingInUpload, extraInUpload, matchingFields },
                stats: {
                    totalRows: uploadRows.length,
                    newRows: newRowCount,
                    updatedRows: updatedRowCount,
                },
            });
        }

        // ── Phase 2: confirmed import ────────────────────────────────────────

        const mainKeyMap = new Map<string, number>();
        if (hasDupKey) {
            mainRows.forEach((row, i) => {
                const k = (row[dupKey] ?? "").trim();
                if (k) mainKeyMap.set(k.toLowerCase(), i);
            });
        }

        let added = 0;
        let updated = 0;
        let imagesDownloaded = 0;
        let imagesFailed = 0;

        const imageDir = IMAGE_DIRS[type];
        const imageMainField = matchingFields.includes("Image_URL") ? "Image_URL" : null;
        const imageUploadField = imageMainField ? fieldMap[imageMainField] : null;

        const timestamp = new Date().toISOString();

        for (const uploadRow of uploadRows) {
            // Map upload row values to main header keys (only matching fields)
            const mappedRow: Record<string, string> = {};
            matchingFields.forEach(mh => {
                mappedRow[mh] = uploadRow[fieldMap[mh]] ?? "";
            });
            mappedRow["Updated_At"] = timestamp;

            const keyVal = hasDupKey ? (mappedRow[dupKey] ?? "").trim() : "";
            const existingIdx = (hasDupKey && keyVal)
                ? mainKeyMap.get(keyVal.toLowerCase())
                : undefined;

            if (existingIdx !== undefined) {
                // Update only matching fields in the existing row
                matchingFields.forEach(mh => {
                    mainRows[existingIdx][mh] = mappedRow[mh];
                });
                mainRows[existingIdx]["Updated_At"] = timestamp;
                updated++;
            } else {
                // Append as new row (empty values for missing fields)
                const newRow: Record<string, string> = {};
                mainHeaders.forEach(h => { newRow[h] = mappedRow[h] ?? ""; });
                mainRows.push(newRow);
                if (hasDupKey && keyVal) {
                    mainKeyMap.set(keyVal.toLowerCase(), mainRows.length - 1);
                }
                added++;
            }

            // Download image from Image_URL if present
            if (imageUploadField) {
                const imageUrl = (uploadRow[imageUploadField] ?? "").trim();
                const keyForFilename = hasDupKey ? keyVal : "";

                if (imageUrl && keyForFilename) {
                    const safeStem = keyForFilename.replace(/[^a-zA-Z0-9_\-.]/g, "_");
                    const result = await downloadImage(imageUrl, imageDir, safeStem);
                    if (result.success && result.savedPath) {
                        imagesDownloaded++;
                        const targetIdx = existingIdx !== undefined ? existingIdx : mainRows.length - 1;
                        mainRows[targetIdx]["Image_URL"] = result.savedPath;
                    } else {
                        imagesFailed++;
                    }
                }
            }
        }

        // Write merged CSV back to disk
        writeCSV(csvPath, mainHeaders, mainRows);

        // Invalidate in-memory cache
        if (type === "books") invalidateBooksCache();
        else invalidateStandardsCache();

        return NextResponse.json({
            success: true,
            stats: { added, updated, imagesDownloaded, imagesFailed },
        });
    } catch (err) {
        console.error("upload-csv error:", err);
        return NextResponse.json({ error: `Failed to process CSV: ${String(err)}` }, { status: 500 });
    }
}
