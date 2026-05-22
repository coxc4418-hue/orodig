import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import { isUsingFirebaseAdmin } from "@workspace/db";

const require = createRequire(import.meta.url);

const MAX_BYTES = 2 * 1024 * 1024;

export async function uploadCommunityImage(
  memberId: number,
  base64Data: string,
  mimeType = "image/jpeg",
): Promise<string> {
  if (!isUsingFirebaseAdmin()) {
    throw new Error("Firebase Admin no configurado — no se pueden subir imágenes a Storage");
  }

  const match = base64Data.match(/^data:([^;]+);base64,(.+)$/);
  const raw = match ? match[2] : base64Data;
  const contentType = match ? match[1] : mimeType;
  const buffer = Buffer.from(raw, "base64");

  if (buffer.length > MAX_BYTES) {
    throw new Error("La imagen no puede superar 2MB");
  }

  const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
  const path = `community/${memberId}/${randomUUID()}.${ext}`;

  const { getStorage } = require("firebase-admin/storage");
  const bucket = getStorage().bucket();
  const file = bucket.file(path);

  await file.save(buffer, {
    metadata: { contentType, cacheControl: "public, max-age=31536000" },
    public: true,
  });

  return `https://storage.googleapis.com/${bucket.name}/${path}`;
}
