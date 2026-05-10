import fs from "fs";
import path from "path";

export const BOOKS_CSV_PATH = path.join(process.cwd(), "data", "wiley_books.csv");
export const STANDARDS_CSV_PATH = path.join(process.cwd(), "data", "standards.csv");

// ── CSV helpers ───────────────────────────────────────────────────────────────

function escapeCSVValue(value: string): string {
    const s = String(value ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
}

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
            result.push(current);
            current = "";
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

// ── Public helpers ────────────────────────────────────────────────────────────

export interface CsvData {
    headers: string[];
    rows: Record<string, string>[];
}

/** Read a CSV and return its original headers + rows (no normalisation). */
export function readCSV(filePath: string): CsvData {
    let content = fs.readFileSync(filePath, "utf-8");
    // Strip UTF-8 BOM if present (common in Windows-created CSV files)
    if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);

    // Character-level parse — correctly handles quoted fields with embedded newlines
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
                if (currentRow.some((v) => v.trim())) allRows.push(currentRow);
                currentRow = []; i++;
            } else if (ch === '\n') {
                currentRow.push(field); field = "";
                if (currentRow.some((v) => v.trim())) allRows.push(currentRow);
                currentRow = [];
            } else { field += ch; }
        }
    }
    if (currentRow.length > 0 || field) {
        currentRow.push(field);
        if (currentRow.some((v) => v.trim())) allRows.push(currentRow);
    }

    if (allRows.length < 1) return { headers: [], rows: [] };

    const headers = allRows[0];
    const rows = allRows
        .slice(1)
        .map((values) => {
            const obj: Record<string, string> = {};
            headers.forEach((h, i) => { obj[h] = values[i] ?? ""; });
            return obj;
        })
        .filter((row) => Object.values(row).some((v) => v.trim()));

    return { headers, rows };
}

/** Write headers + rows back to a CSV file. */
export function writeCSV(filePath: string, headers: string[], rows: Record<string, string>[]): void {
    const lines = [
        headers.map(escapeCSVValue).join(","),
        ...rows.map((row) => headers.map((h) => escapeCSVValue(row[h] ?? "")).join(",")),
    ];
    fs.writeFileSync(filePath, lines.join("\n"), "utf-8");
}
