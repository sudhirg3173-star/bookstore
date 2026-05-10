import fs from "fs";
import path from "path";
import { Standard } from "@/types/standard";

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

export function getAllStandards(): Standard[] {
    if (_standards) return _standards;
    try {
        const csvPath = path.join(process.cwd(), "data", "standards.csv");
        const content = fs.readFileSync(csvPath, "utf-8");
        const rows = parseCSV(content);
        _standards = rows.map((row) => {
            const rawPrice = row["price"] || "0";
            // Extract currency code from price string, e.g. "INR 16,799.16" → "INR"
            const currencyMatch = rawPrice.match(/^([A-Z]{2,4})\s*/i);
            const currency = currencyMatch ? currencyMatch[1].toUpperCase() : "INR";
            const price = parseFloat(rawPrice.replace(/[^0-9.]/g, "")) || 0;
            const number = row["standard_number"] || row["standard_number_"] || Object.values(row)[0] || "";
            return {
                number,
                name: row["standard_name"] || "",
                year: parseInt(row["year"] || "0", 10),
                publisher: row["publisher"] || "",
                price,
                currency,
                description: row["description"] || "",
                slug: standardSlug(number),
            } as Standard;
        });
        return _standards;
    } catch (err) {
        console.error("Error reading standards CSV:", err);
        return [];
    }
}

export function getStandardBySlug(slug: string): Standard | undefined {
    return getAllStandards().find((s) => s.slug === slug);
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
