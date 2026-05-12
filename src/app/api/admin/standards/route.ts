import { NextRequest, NextResponse } from "next/server";
import { STANDARDS_CSV_PATH, readCSV, writeCSV } from "@/lib/adminCsv";
import { invalidateStandardsCache } from "@/lib/standards";

export const dynamic = "force-dynamic";

/** Merge any keys in `body` that aren't yet in `headers`. */
function mergeHeaders(headers: string[], body: Record<string, string>): string[] {
    const merged = [...headers];
    Object.keys(body).forEach((k) => { if (!merged.includes(k)) merged.push(k); });
    return merged;
}

/** GET /api/admin/standards — return all rows with their index */
export function GET() {
    try {
        const { headers, rows } = readCSV(STANDARDS_CSV_PATH);
        const data = rows.map((row, index) => ({ _index: index, ...row }));
        return NextResponse.json({ headers, rows: data });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed to read standards CSV" }, { status: 500 });
    }
}

/** POST /api/admin/standards — append a new row */
export async function POST(req: NextRequest) {
    try {
        const body: Record<string, string> = await req.json();
        body["Updated_At"] = new Date().toISOString();
        const { headers, rows } = readCSV(STANDARDS_CSV_PATH);
        const merged = mergeHeaders(headers, body);
        const cleanRow: Record<string, string> = {};
        merged.forEach((h) => { cleanRow[h] = body[h] ?? ""; });
        rows.push(cleanRow);
        writeCSV(STANDARDS_CSV_PATH, merged, rows);
        invalidateStandardsCache();
        return NextResponse.json({ success: true, index: rows.length - 1 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed to create standard" }, { status: 500 });
    }
}
