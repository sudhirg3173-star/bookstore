import { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function hasAdminSession(request: NextRequest): Promise<boolean> {
    const token = request.cookies.get("admin_session")?.value;
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    if (!token || !email || !password) return false;

    try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(`${email}:${password}`));
        return payload.email === email;
    } catch {
        return false;
    }
}