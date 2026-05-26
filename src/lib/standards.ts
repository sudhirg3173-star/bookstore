import fs from "fs";
import path from "path";
import { Standard } from "@/types/standard";
import { readCSV, writeCSV } from "@/lib/adminCsv";

// ── CSV helpers (same as books.ts) ──────────────────────────────────────────
function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
            else inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
            result.push(current.trim());
            current = "";
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

function parseCSV(content: string): Record<string, string>[] {
    const lines = content.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];
    const rawHeaders = parseCSVLine(lines[0]);
    const headers = rawHeaders.map((h) =>
        h.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_")
    );
    return lines.slice(1).map((line) => {
        const values = parseCSVLine(line);
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => { obj[h] = values[i] || ""; });
        return obj;
    }).filter((row) => row[headers[0]]);
}

// ── Slug helper ──────────────────────────────────────────────────────────────
export function standardSlug(number: string): string {
    return number.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ── Module cache ─────────────────────────────────────────────────────────────
let _standards: Standard[] | null = null;

export function invalidateStandardsCache(): void {
    _standards = null;
}
// ── Background image downloader ───────────────────────────────────────────────
const _downloadingStandards = new Set<string>();

async function downloadAndUpdateStandardImage(
    csvPath: string,
    number: string,
    imageUrl: string,
): Promise<void> {
    const key = `${number}::${imageUrl}`;
    if (_downloadingStandards.has(key)) return;
    _downloadingStandards.add(key);
    try {
        const destDir = path.join(process.cwd(), "public", "images", "standards");
        fs.mkdirSync(destDir, { recursive: true });

        const controller = new AbortController();
        const timerId = setTimeout(() => controller.abort(), 20_000);
        try {
            const res = await fetch(imageUrl, { signal: controller.signal });
            if (!res.ok) return;

            const contentType = res.headers.get("content-type") ?? "";
            let ext = ".jpg";
            if (contentType.includes("png")) ext = ".png";
            else if (contentType.includes("webp")) ext = ".webp";
            else if (contentType.includes("gif")) ext = ".gif";
            else {
                const urlExt = imageUrl.split("?")[0].split(".").pop()?.toLowerCase();
                if (urlExt && ["jpg", "jpeg", "png", "webp", "gif"].includes(urlExt))
                    ext = `.${urlExt === "jpeg" ? "jpg" : urlExt}`;
            }

            const safeStem = number.replace(/[^a-zA-Z0-9_\-.]/g, "_");
            const destPath = path.join(destDir, safeStem + ext);
            fs.writeFileSync(destPath, Buffer.from(await res.arrayBuffer()));

            const localPath = `/images/standards/${safeStem}${ext}`;

            // Update the CSV row so the local path is persisted
            const { headers, rows } = readCSV(csvPath);
            let changed = false;
            for (const row of rows) {
                if ((row["Standard Number"] ?? "").trim() === number.trim() &&
                    (row["Image_URL"] ?? "").startsWith("http")) {
                    row["Image_URL"] = localPath;
                    changed = true;
                }
            }
            if (changed) {
                writeCSV(csvPath, headers, rows);
                invalidateStandardsCache();
            }
        } finally {
            clearTimeout(timerId);
        }
    } catch (err) {
        console.error(`Standard image download failed (${number}):`, err);
    } finally {
        _downloadingStandards.delete(key);
    }
}
export function getAllStandards(): Standard[] {
    if (_standards) return _standards;
    try {
        const csvPath = path.join(process.cwd(), "data", "standards.csv");
        const content = fs.readFileSync(csvPath, "utf-8");
        const rows = parseCSV(content);

        const toDownload: Array<{ number: string; url: string }> = [];

        _standards = rows.map((row) => {
            const rawPrice = row["price"] || "0";
            // Prefer the dedicated Currency column; fall back to extracting from the price string
            const currencyFromCol = (row["currency"] || "").trim().toUpperCase();
            const currencyMatch = rawPrice.match(/^([A-Z]{2,4})\s*/i);
            const currency = currencyFromCol || (currencyMatch ? currencyMatch[1].toUpperCase() : "INR");
            const price = parseFloat(rawPrice.replace(/[^0-9.]/g, "")) || 0;
            const number = row["standard_number"] || row["standard_number_"] || Object.values(row)[0] || "";
            const rawDiscount = parseInt(row["discount"] || row["Discount"] || "0", 10);
            const discount = rawDiscount > 0 ? rawDiscount : undefined;

            const rawImageUrl = row["image_url"] || "";
            const isHttp = rawImageUrl.startsWith("http");

            if (isHttp && number) {
                toDownload.push({ number, url: rawImageUrl });
            }

            return {
                number,
                name: row["standard_name"] || "",
                year: parseInt(row["year"] || "0", 10),
                publisher: row["publisher"] || "",
                price,
                currency,
                description: row["description"] || "",
                // HTTP URLs: show no image (fallback) while background download runs.
                imageUrl: isHttp ? "" : rawImageUrl,
                slug: standardSlug(number),
                discount,
            } as Standard;
        });

        // Fire-and-forget downloads for any standards still using external image URLs
        for (const { number, url } of toDownload) {
            downloadAndUpdateStandardImage(csvPath, number, url).catch(console.error);
        }

        return _standards;
    } catch (err) {
        console.error("Error reading standards CSV:", err);
        return [];
    }
}

export function getStandardBySlug(slug: string): Standard | undefined {
    return getAllStandards().find((s) => s.slug === slug);
}

export function getTrendingStandards(): Standard[] {
    const jsonPath = path.join(process.cwd(), "data", "trending.json");
    let slugs: string[] = [];
    try {
        const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
        slugs = data.standard ?? [];
    } catch {
        console.error("trending.json not found or invalid");
        return [];
    }

    const slugMap = new Map(getAllStandards().map((s) => [s.slug, s]));
    return slugs
        .map((slug) => slugMap.get(slug))
        .filter((s): s is Standard => s !== undefined);
}

export function searchStandards(query: string): Standard[] {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return getAllStandards().filter(
        (s) =>
            s.name.toLowerCase().includes(q) ||
            s.number.toLowerCase().includes(q) ||
            s.publisher.toLowerCase().includes(q) ||
            s.description.toLowerCase().includes(q) ||
            String(s.year).includes(q)
    );
}

export function getStandardPublishers(): string[] {
    const publishers = new Set(getAllStandards().map((s) => s.publisher));
    return Array.from(publishers).filter(Boolean).sort();
}
