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

/** PUT /api/admin/standards/[id] — update row at index */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const index = parseInt(id, 10);
    try {
        const body: Record<string, string> = await req.json();
        body["Updated_At"] = new Date().toISOString();
        const { headers, rows } = readCSV(STANDARDS_CSV_PATH);
        if (index < 0 || index >= rows.length) {
            return NextResponse.json({ error: "Row not found" }, { status: 404 });
        }
        const merged = mergeHeaders(headers, body);
        const cleanRow: Record<string, string> = {};
        merged.forEach((h) => { cleanRow[h] = body[h] ?? rows[index][h] ?? ""; });
        rows[index] = cleanRow;
        writeCSV(STANDARDS_CSV_PATH, merged, rows);
        invalidateStandardsCache();
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed to update standard" }, { status: 500 });
    }
}

/** DELETE /api/admin/standards/[id] — delete row at index */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const index = parseInt(id, 10);
    try {
        const { headers, rows } = readCSV(STANDARDS_CSV_PATH);
        if (index < 0 || index >= rows.length) {
            return NextResponse.json({ error: "Row not found" }, { status: 404 });
        }
        rows.splice(index, 1);
        writeCSV(STANDARDS_CSV_PATH, headers, rows);
        invalidateStandardsCache();
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed to delete standard" }, { status: 500 });
    }
}
