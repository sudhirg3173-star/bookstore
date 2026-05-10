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

/** GET /api/admin/books — return all rows with their index */
export function GET() {
    try {
        const { headers, rows } = readCSV(BOOKS_CSV_PATH);
        const data = rows.map((row, index) => ({ _index: index, ...row }));
        return NextResponse.json({ headers, rows: data });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: `Failed to read books CSV: ${String(err)}` }, { status: 500 });
    }
}


/** POST /api/admin/books — append a new row */
export async function POST(req: NextRequest) {
    try {
        const body: Record<string, string> = await req.json();
        const { headers, rows } = readCSV(BOOKS_CSV_PATH);
        const merged = mergeHeaders(headers, body);
        // Build a clean row using merged headers
        const cleanRow: Record<string, string> = {};
        merged.forEach((h) => { cleanRow[h] = body[h] ?? ""; });
        rows.push(cleanRow);
        writeCSV(BOOKS_CSV_PATH, merged, rows);
        invalidateBooksCache();
        return NextResponse.json({ success: true, index: rows.length - 1 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: `Failed to create book: ${String(err)}` }, { status: 500 });
    }
}
