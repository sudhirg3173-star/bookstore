/**
 * Merges wiley_books.csv into books-master.csv
 * - Maps Author→Authors, ISBN→SKU, strips "INR " from Price, sets Availability="In Stock"
 * - Deduplicates by SKU (keeps existing master rows, skips duplicates from wiley)
 * Run: node scripts/merge-csv.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const MASTER = path.join(ROOT, "data", "books-master.csv");
const MASTER_TMP = path.join(ROOT, "data", "books-master-merged.csv");
const WILEY = path.join(ROOT, "..", "wiley_books.csv");

// ---------- minimal CSV parser ----------
function parseCSVLine(line) {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
            if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
            else inQuotes = !inQuotes;
        } else if (c === "," && !inQuotes) {
            result.push(current.trim());
            current = "";
        } else {
            current += c;
        }
    }
    result.push(current.trim());
    return result;
}

function readCSV(filePath) {
    const lines = fs.readFileSync(filePath, "utf-8").split(/\r?\n/).filter(l => l.trim());
    const headers = parseCSVLine(lines[0]);
    return {
        headers,
        rows: lines.slice(1).map(line => {
            const vals = parseCSVLine(line);
            const obj = {};
            headers.forEach((h, i) => { obj[h] = vals[i] ?? ""; });
            return obj;
        }).filter(r => Object.values(r).some(v => v)),
    };
}

function escapeCSVField(val) {
    const s = String(val ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
}

function rowToCSVLine(row, headers) {
    return headers.map(h => escapeCSVField(row[h] ?? "")).join(",");
}

// ---------- main ----------
const master = readCSV(MASTER);
const wiley = readCSV(WILEY);

// Master headers are the canonical schema
const HEADERS = master.headers; // Subject,Title,Authors,SKU,Price,Availability,Pages,Publication_Year,Category,Image_URL,Book_URL,Description

// Collect existing SKUs
const existingSkus = new Set(master.rows.map(r => r["SKU"]));

let added = 0;
let skipped = 0;
const newRows = [];

for (const row of wiley.rows) {
    const sku = row["ISBN"] || "";
    if (!sku) { skipped++; continue; }
    if (existingSkus.has(sku)) { skipped++; continue; }

    // Normalise price: strip "INR " prefix and commas
    const rawPrice = row["Price"] || "0";
    const price = rawPrice.replace(/INR\s*/i, "").replace(/,/g, "").trim();

    const mapped = {
        Subject: row["Subject"] || "",
        Title: row["Title"] || "",
        Authors: row["Author"] || "",
        SKU: sku,
        Price: price,
        Availability: "In Stock",
        Pages: row["Pages"] || "0",
        Publication_Year: row["Publication_Year"] || "",
        Category: row["Category"] || "",
        Image_URL: row["Image_URL"] || "",
        Book_URL: row["Book_URL"] || "",
        Description: row["Description"] || "",
    };

    newRows.push(mapped);
    existingSkus.add(sku);
    added++;
}

// Write merged CSV
const allRows = [...master.rows, ...newRows];
const lines = [
    HEADERS.join(","),
    ...allRows.map(r => rowToCSVLine(r, HEADERS)),
];
fs.writeFileSync(MASTER_TMP, lines.join("\n"), "utf-8");
console.log(`  Written to: data/books-master-merged.csv`);

console.log(`✓ Merged complete.`);
console.log(`  Existing rows : ${master.rows.length}`);
console.log(`  New rows added: ${added}`);
console.log(`  Duplicates skipped: ${skipped}`);
console.log(`  Total rows now: ${allRows.length}`);
