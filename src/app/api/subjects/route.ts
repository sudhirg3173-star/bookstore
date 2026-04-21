import { getSubjects } from "@/lib/books";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
    return NextResponse.json(getSubjects());
}
