/** Avatares y portadas en Firestore (data URL) — sin Storage de pago. */

const MAX_AVATAR_BYTES = 200 * 1024;
const MAX_COVER_BYTES = 450 * 1024;

function normalizeDataUrl(base64Data: string, mimeType: string, maxBytes: number): string {
  const match = base64Data.match(/^data:([^;]+);base64,(.+)$/);
  const raw = match ? match[2] : base64Data;
  const contentType = match ? match[1] : mimeType;

  if (!/^image\/(jpeg|jpg|png|webp)$/i.test(contentType)) {
    throw new Error("Solo se permiten imágenes JPEG, PNG o WebP");
  }

  const buffer = Buffer.from(raw, "base64");
  if (buffer.length > maxBytes) {
    throw new Error("La imagen es muy grande. Elige una foto más pequeña.");
  }
  if (buffer.length < 32) {
    throw new Error("Imagen inválida");
  }

  return `data:${contentType};base64,${raw}`;
}

export function prepareAvatarImage(base64Data: string, mimeType = "image/jpeg"): string {
  return normalizeDataUrl(base64Data, mimeType, MAX_AVATAR_BYTES);
}

export function prepareCoverImage(base64Data: string, mimeType = "image/jpeg"): string {
  return normalizeDataUrl(base64Data, mimeType, MAX_COVER_BYTES);
}
