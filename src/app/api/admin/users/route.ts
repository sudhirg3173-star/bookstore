import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const { db } = getFirebaseAdmin();
        const search = req.nextUrl.searchParams.get("search")?.toLowerCase() ?? "";
        const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10));
        const limit = 10;

        const snapshot = await db.collection("users").orderBy("createdAt", "desc").get();
        let users = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Record<string, unknown>[];

        if (search) {
            users = users.filter((u) => {
                const name = String(u.name ?? "").toLowerCase();
                const email = String(u.email ?? "").toLowerCase();
                return name.includes(search) || email.includes(search);
            });
        }

        const total = users.length;
        const paginated = users.slice((page - 1) * limit, page * limit);

        return NextResponse.json({ users: paginated, total, page, limit });
    } catch (err) {
        console.error("Failed to list users:", err);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}
