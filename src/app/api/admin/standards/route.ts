import { NextRequest, NextResponse } from "next/server";
import { STANDARDS_CSV_PATH, readCSV, writeCSV } from "@/lib/adminCsv";
import { invalidateStandardsCache } from "@/lib/standards";

export const dynamic = "force-dynamic";

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
        const { headers, rows } = readCSV(STANDARDS_CSV_PATH);
        rows.push(body);
        writeCSV(STANDARDS_CSV_PATH, headers, rows);
        invalidateStandardsCache();
        return NextResponse.json({ success: true, index: rows.length - 1 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed to create standard" }, { status: 500 });
    }
}
