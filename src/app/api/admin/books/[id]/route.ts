import { NextRequest, NextResponse } from "next/server";
import { BOOKS_CSV_PATH, readCSV, writeCSV } from "@/lib/adminCsv";
import { invalidateBooksCache } from "@/lib/books";

export const dynamic = "force-dynamic";

/** Merge any keys in `body` that aren't yet in `headers` (e.g. new Currency column). */
function mergeHeaders(headers: string[], body: Record<string, string>): string[] {
    const merged = [...headers];
    Object.keys(body).forEach((k) => { if (!merged.includes(k)) merged.push(k); });
    return merged;
}

/** PUT /api/admin/books/[id] — update row at index */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const index = parseInt(id, 10);
    try {
        const body: Record<string, string> = await req.json();
        const { headers, rows } = readCSV(BOOKS_CSV_PATH);
        if (isNaN(index) || index < 0 || index >= rows.length) {
            return NextResponse.json({ error: `Row not found (index ${index}, total ${rows.length})` }, { status: 404 });
        }
        const merged = mergeHeaders(headers, body);
        // Build a clean row using merged headers
        const cleanRow: Record<string, string> = {};
        merged.forEach((h) => { cleanRow[h] = body[h] ?? rows[index][h] ?? ""; });
        rows[index] = cleanRow;
        writeCSV(BOOKS_CSV_PATH, merged, rows);
        invalidateBooksCache();
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("PUT /api/admin/books/[id] error:", err);
        return NextResponse.json({ error: `Failed to update book: ${String(err)}` }, { status: 500 });
    }
}

/** DELETE /api/admin/books/[id] — delete row at index */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const index = parseInt(id, 10);
    try {
        const { headers, rows } = readCSV(BOOKS_CSV_PATH);
        if (isNaN(index) || index < 0 || index >= rows.length) {
            return NextResponse.json({ error: "Row not found" }, { status: 404 });
        }
        rows.splice(index, 1);
        writeCSV(BOOKS_CSV_PATH, headers, rows);
        invalidateBooksCache();
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: `Failed to delete book: ${String(err)}` }, { status: 500 });
    }
}
