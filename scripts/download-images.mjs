/**
 * Downloads all book cover images from the CSV and saves them to public/images/books/
 * Uses the SKU as the filename: public/images/books/{sku}.jpg
 * Run with: node scripts/download-images.mjs
 */

import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "public", "images", "books");
const CSV_CANDIDATES = [
    path.join(ROOT, "data", "books-master-merged.csv"),
    path.join(ROOT, "data", "books-master.csv"),
];
const CSV_PATH = CSV_CANDIDATES.find(p => fs.existsSync(p)) || CSV_CANDIDATES[0];

// Ensure output directory exists
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// --- Minimal CSV parser ---
function parseCSVLine(line) {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
            else { inQuotes = !inQuotes; }
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

function parseCSV(content) {
    const lines = content.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];
    const headers = parseCSVLine(lines[0]).map((h) =>
        h.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_")
    );
    return lines.slice(1).map((line) => {
        const values = parseCSVLine(line);
        const obj = {};
        headers.forEach((h, i) => { obj[h] = values[i] || ""; });
        return obj;
    });
}

// --- Download helper ---
function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destPath);
        const protocol = url.startsWith("https") ? https : http;

        const request = protocol.get(url, { timeout: 15000 }, (res) => {
            // Follow redirects
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                file.close();
                fs.unlink(destPath, () => { });
                return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                file.close();
                fs.unlink(destPath, () => { });
                return reject(new Error(`HTTP ${res.statusCode}`));
            }
            res.pipe(file);
            file.on("finish", () => { file.close(); resolve(); });
        });

        request.on("error", (err) => {
            file.close();
            fs.unlink(destPath, () => { });
            reject(err);
        });
        request.on("timeout", () => {
            request.destroy();
            reject(new Error("Timeout"));
        });
    });
}

// --- Main ---
async function main() {
    const content = fs.readFileSync(CSV_PATH, "utf-8");
    const rows = parseCSV(content);

    const items = rows
        .map((row) => ({ sku: row["sku"] || row["s_k_u"] || "", url: row["image_url"] || "" }))
        .filter((item) => {
            if (!item.sku || !item.url) return false;
            try { new URL(item.url); return true; } catch { return false; }
        });

    console.log(`Found ${items.length} books with images to download.\n`);

    let succeeded = 0;
    let failed = 0;
    let skipped = 0;

    for (const [i, item] of items.entries()) {
        const ext = path.extname(new URL(item.url).pathname).split("?")[0] || ".jpg";
        const destPath = path.join(OUTPUT_DIR, `${item.sku}${ext}`);

        if (fs.existsSync(destPath)) {
            process.stdout.write(`[${i + 1}/${items.length}] SKIP  ${item.sku}\r`);
            skipped++;
            continue;
        }

        try {
            await downloadFile(item.url, destPath);
            process.stdout.write(`[${i + 1}/${items.length}] OK    ${item.sku}\n`);
            succeeded++;
        } catch (err) {
            process.stdout.write(`[${i + 1}/${items.length}] FAIL  ${item.sku} — ${err.message}\n`);
            failed++;
        }
    }

    console.log(`\n✓ Done. Downloaded: ${succeeded}  Skipped: ${skipped}  Failed: ${failed}`);
    console.log(`Images saved to: public/images/books/`);
}

main().catch(console.error);
