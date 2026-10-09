
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { getUserFromRequest } from "@/lib/http/request";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !apiKey || !secret) {
    return NextResponse.json({ error: "Image uploads aren't configured yet. Paste an image URL instead." }, { status: 501 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: "Use a JPG, PNG, WebP or AVIF image" }, { status: 415 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Image must be under 5 MB" }, { status: 413 });

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = "cms";
  const signature = createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${secret}`).digest("hex");

  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", apiKey);
  fd.append("timestamp", timestamp);
  fd.append("folder", folder);
  fd.append("signature", signature);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: "POST", body: fd });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.secure_url) {
      console.error("Cloudinary upload failed:", json);
      return NextResponse.json({ error: json?.error?.message ?? "Upload failed" }, { status: 502 });
    }
    return NextResponse.json({ url: json.secure_url as string });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}