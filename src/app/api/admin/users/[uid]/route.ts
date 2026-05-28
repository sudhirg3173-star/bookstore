import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ uid: string }> }
) {
    try {
        const { uid } = await params;
        const body = await req.json().catch(() => ({}));
        const { name, email, role } = body as { name?: string; email?: string; role?: string };

        if (role !== undefined && !["buyer", "seller"].includes(role)) {
            return NextResponse.json({ error: "Invalid role. Must be 'buyer' or 'seller'." }, { status: 400 });
        }
        if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
        }

        const { db, auth } = getFirebaseAdmin();

        // Build Firestore update payload (only include provided fields)
        const firestoreUpdate: Record<string, string> = {};
        if (name !== undefined && name.trim()) firestoreUpdate.name = name.trim();
        if (email !== undefined) firestoreUpdate.email = email.trim();
        if (role !== undefined) firestoreUpdate.role = role;

        if (Object.keys(firestoreUpdate).length === 0) {
            return NextResponse.json({ error: "No fields to update." }, { status: 400 });
        }

        // Update Firestore profile
        await db.collection("users").doc(uid).update(firestoreUpdate);

        // Sync changes to Firebase Auth user record
        const authUpdate: { displayName?: string; email?: string } = {};
        if (firestoreUpdate.name) authUpdate.displayName = firestoreUpdate.name;
        if (firestoreUpdate.email) authUpdate.email = firestoreUpdate.email;
        if (Object.keys(authUpdate).length > 0) {
            await auth.updateUser(uid, authUpdate);
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Failed to update user:", err);
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ uid: string }> }
) {
    try {
        const { uid } = await params;
        const { db, auth } = getFirebaseAdmin();

        // Delete Firestore profile and wishlist, then Firebase Auth account
        await Promise.all([
            db.collection("users").doc(uid).delete(),
            db.collection("wishlists").doc(uid).delete(),
        ]);
        await auth.deleteUser(uid);

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Failed to delete user:", err);
        return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
    }
}
