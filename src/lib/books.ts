import fs from "fs";
import path from "path";
import { Book } from "@/types/book";
import { getBookRating, getReviewCount, getDiscount } from "@/lib/utils";

function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
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
            else if (ch === ',') { currentRow.push(field.trim()); field = ""; }
            else if (ch === '\r' && next === '\n') {
                currentRow.push(field.trim()); field = "";
                if (currentRow.some((v) => v.trim())) allRows.push(currentRow);
                currentRow = []; i++;
            } else if (ch === '\n') {
                currentRow.push(field.trim()); field = "";
                if (currentRow.some((v) => v.trim())) allRows.push(currentRow);
                currentRow = [];
            } else { field += ch; }
        }
    }
    if (currentRow.length > 0 || field) {
        currentRow.push(field.trim());
        if (currentRow.some((v) => v.trim())) allRows.push(currentRow);
    }

    if (allRows.length < 2) return [];

    const rawHeaders = allRows[0];
    const headers = rawHeaders.map((h) =>
        h
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "_")
            .replace(/_+/g, "_")
    );

    return allRows
        .slice(1)
        .map((values) => {
            const obj: Record<string, string> = {};
            headers.forEach((header, i) => {
                obj[header] = values[i] || "";
            });
            return obj;
        })
        .filter((row) => Object.values(row).some((v) => v.trim()));
}

let _books: Book[] | null = null;

export function invalidateBooksCache(): void {
    _books = null;
}

function resolveCsvPath(): string {
    const candidates = [
        path.join(process.cwd(), "data", "wiley_books.csv"),
    ];
    for (const p of candidates) {
        if (fs.existsSync(p)) return p;
    }
    return candidates[0];
}

export function getAllBooks(): Book[] {
    if (_books) return _books;

    try {
        const csvPath = resolveCsvPath();
        const content = fs.readFileSync(csvPath, "utf-8");
        const rows = parseCSV(content);

        _books = rows.map((row) => {
            // wiley_books.csv uses "isbn" and "author" (singular) instead of "sku"/"authors"
            // Excel corrupts 13-digit ISBNs to scientific notation (e.g. 9.78937E+12).
            // The full ISBN is always embedded in the image_url filename — extract from there.
            const imgFilename = (row["image_url"] || "").split("/").pop() || "";
            const isbnFromImg = imgFilename.replace(/(_\d+)?\.[^.]+$/, "");
            const rawIsbn = row["isbn"] || row["sku"] || row["s_k_u"] || "";
            const sku = /^\d{13}$/.test(isbnFromImg) ? isbnFromImg : rawIsbn;
            const title = row["title"] || "";
            // Price is now a plain number in the CSV
            const rawPrice = row["price"] || "0";
            const price = parseFloat(rawPrice.replace(/[^\d.]/g, "")) || 0;
            const rating = getBookRating(sku);
            const reviewCount = getReviewCount(sku);
            const discount = getDiscount(sku);

            return {
                subject: row["subject"] || "",
                title,
                authors: row["author"] || row["authors"] || "",
                sku,
                price,
                currency: row["currency"] || "INR",
                availability: row["availability"] === "Out of Stock" ? "Out of Stock" : "In Stock",
                pages: parseInt(row["pages"] || "0", 10),
                publicationYear: parseInt(row["publication_year"] || "0", 10),
                category: row["category"] || "",
                imageUrl: imgFilename ? `/images/books/${imgFilename}` : (row["image_url"] || ""),
                bookUrl: row["book_url"] || "",
                description: row["description"] || "",
                slug: sku,
                rating,
                reviewCount,
                discount,
            } as Book;
        });

        return _books;
    } catch (error) {
        console.error("Error reading books CSV:", error);
        return [];
    }
}

export function getBookBySku(sku: string): Book | undefined {
    return getAllBooks().find((b) => b.slug === sku);
}

export function getBooksBySubject(subject: string): Book[] {
    return getAllBooks().filter(
        (b) => b.subject.toLowerCase() === subject.toLowerCase()
    );
}

export function getSubjects(): string[] {
    const subjects = new Set(getAllBooks().map((b) => b.subject));
    const all = Array.from(subjects).filter(Boolean).sort();
    const pinned = "New Releases";
    return all.includes(pinned) ? [pinned, ...all.filter((s) => s !== pinned)] : all;
}

export function subjectToSlug(subject: string): string {
    return subject.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export function slugToSubject(slug: string): string | undefined {
    return getSubjects().find((s) => subjectToSlug(s) === slug);
}

export function getCategories(): string[] {
    const cats = new Set(getAllBooks().map((b) => b.category));
    return Array.from(cats).filter(Boolean).sort();
}

export function getNewReleases(limit?: number): Book[] {
    const books = getAllBooks().filter((b) => b.subject === "New Releases");
    return limit ? books.slice(0, limit) : books;
}

export function getTrendingBooks(limit = 8): Book[] {
    const jsonPath = path.join(process.cwd(), "data", "trending.json");
    let skus: string[] = [];
    try {
        const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
        skus = data.books ?? [];
    } catch {
        console.error("trending.json not found or invalid");
        return [];
    }

    const bookMap = new Map(getAllBooks().map((b) => [b.sku, b]));
    return skus
        .slice(0, limit)
        .map((sku) => bookMap.get(sku))
        .filter((b): b is Book => b !== undefined);
}

export function getFeaturedBooks(limit = 8): Book[] {
    return getAllBooks()
        .filter((b) => b.availability === "In Stock" && b.discount !== undefined)
        .slice(0, limit);
}

export function getBooksOfMonth(limit = 6): Book[] {
    return getAllBooks()
        .filter((b) => b.subject === "New Releases" || b.subject === "Emerging Technologies")
        .slice(0, limit);
}

export function getTopBooks(limit = 8): Book[] {
    return getAllBooks()
        .filter((b) => b.availability === "In Stock")
        .sort((a, b) => b.rating - a.rating)
        .slice(0, limit);
}

export function searchBooks(query: string): Book[] {
    if (!query.trim()) return [];
    const q = query.toLowerCase().replace(/[-\s]/g, "");
    const normalize = (s: string) => s.toLowerCase().replace(/[-\s]/g, "");
    return getAllBooks().filter(
        (b) =>
            normalize(b.title).includes(q) ||
            normalize(b.authors).includes(q) ||
            normalize(b.description).includes(q) ||
            normalize(b.subject).includes(q) ||
            normalize(b.category).includes(q) ||
            b.sku.replace(/[-\s]/g, "").toLowerCase().includes(q)
    );
}

export function getRelatedBooks(book: Book, limit = 4): Book[] {
    return getAllBooks()
        .filter(
            (b) =>
                b.sku !== book.sku &&
                (b.subject === book.subject || b.category === book.category)
        )
        .slice(0, limit);
}

export function getPaginatedBooks(
    books: Book[],
    page: number,
    pageSize = 16
): { data: Book[]; total: number; totalPages: number } {
    const total = books.length;
    const totalPages = Math.ceil(total / pageSize);
    const data = books.slice((page - 1) * pageSize, page * pageSize);
    return { data, total, totalPages };
}
