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
    const lines = content.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) return [];

    const rawHeaders = parseCSVLine(lines[0]);
    const headers = rawHeaders.map((h) =>
        h
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "_")
            .replace(/_+/g, "_")
    );

    return lines
        .slice(1)
        .map((line) => {
            const values = parseCSVLine(line);
            const obj: Record<string, string> = {};
            headers.forEach((header, i) => {
                obj[header] = values[i] || "";
            });
            return obj;
        })
        .filter((row) => row[headers[0]]);
}

let _books: Book[] | null = null;

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
            // Price may have "INR " prefix — strip it
            const rawPrice = row["price"] || "0";
            const price = parseFloat(rawPrice.replace(/INR\s*/i, "").replace(/,/g, "")) || 0;
            const rating = getBookRating(sku);
            const reviewCount = getReviewCount(sku);
            const discount = getDiscount(sku);

            return {
                subject: row["subject"] || "",
                title,
                authors: row["author"] || row["authors"] || "",
                sku,
                price,
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
    const inStock = getAllBooks().filter((b) => b.availability === "In Stock");
    const bySubject = new Map<string, Book[]>();

    inStock.forEach((book) => {
        if (!bySubject.has(book.subject)) bySubject.set(book.subject, []);
        bySubject.get(book.subject)!.push(book);
    });

    const trending: Book[] = [];
    const subjects = Array.from(bySubject.keys());
    let idx = 0;

    while (trending.length < limit && idx < limit * subjects.length) {
        const subject = subjects[idx % subjects.length];
        const subBooks = bySubject.get(subject)!;
        const book = subBooks[Math.floor(idx / subjects.length)];
        if (book) trending.push(book);
        idx++;
    }

    return trending.slice(0, limit);
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
    return getAllBooks().filter(
        (b) =>
            b.title.toLowerCase().includes(q) ||
            b.authors.toLowerCase().includes(q) ||
            b.description.toLowerCase().includes(q) ||
            b.subject.toLowerCase().includes(q) ||
            b.category.toLowerCase().includes(q) ||
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
