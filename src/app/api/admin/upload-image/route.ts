import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

// Allowed image MIME types
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
// Max 5 MB
const MAX_SIZE = 5 * 1024 * 1024;

/**
 * POST /api/admin/upload-image
 * Body: multipart/form-data
 *   - file: the image file
 *   - folder: "books" | "standards"
 *   - name: the ISBN or standard number used as the filename stem
 */
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();

        const file = formData.get("file") as File | null;
        const folder = formData.get("folder") as string | null;
        const name = formData.get("name") as string | null;

        // Validate inputs
        if (!file || !folder || !name) {
            return NextResponse.json({ error: "Missing required fields: file, folder, name" }, { status: 400 });
        }

        if (!["books", "standards"].includes(folder)) {
            return NextResponse.json({ error: "folder must be 'books' or 'standards'" }, { status: 400 });
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json({ error: "Only JPEG, PNG, WebP and GIF images are allowed" }, { status: 400 });
        }

        if (file.size > MAX_SIZE) {
            return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 400 });
        }

        // Derive safe filename: sanitise name, keep original extension
        const ext = file.type === "image/jpeg" ? ".jpg"
            : file.type === "image/png" ? ".png"
                : file.type === "image/webp" ? ".webp"
                    : ".gif";

        const safeName = name.replace(/[^a-zA-Z0-9_\-\.]/g, "_");
        const filename = `${safeName}${ext}`;

        // Destination: <project>/public/images/<folder>/<filename>
        const destDir = path.join(process.cwd(), "public", "images", folder);
        fs.mkdirSync(destDir, { recursive: true });

        const destPath = path.join(destDir, filename);

        // Write file
        const buffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(destPath, buffer);

        const publicUrl = `/images/${folder}/${filename}`;
        return NextResponse.json({ success: true, url: publicUrl, filename });
    } catch (err) {
        console.error("Image upload error:", err);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
