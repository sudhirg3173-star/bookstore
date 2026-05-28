import { NextRequest, NextResponse } from "next/server";
import { getAllBooks } from "@/lib/books";

export const dynamic = "force-dynamic";

/**
 * GET /api/books?skus=sku1,sku2,sku3
 * Returns the full Book objects for the given comma-separated SKUs.
 */
export async function GET(req: NextRequest) {
    const skusParam = req.nextUrl.searchParams.get("skus") ?? "";
    if (!skusParam.trim()) {
        return NextResponse.json([]);
    }

    const requestedSkus = new Set(skusParam.split(",").map((s) => s.trim()).filter(Boolean));
    const books = getAllBooks().filter((b) => requestedSkus.has(b.sku));

    return NextResponse.json(books);
}
