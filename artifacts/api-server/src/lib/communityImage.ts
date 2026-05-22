/** Imágenes de comunidad en Firestore (data URL) — sin Firebase Storage ni costo extra. */

const MAX_BYTES = 350 * 1024;

export function prepareCommunityImage(base64Data: string, mimeType = "image/jpeg"): string {
  const match = base64Data.match(/^data:([^;]+);base64,(.+)$/);
  const raw = match ? match[2] : base64Data;
  const contentType = match ? match[1] : mimeType;

  if (!/^image\/(jpeg|jpg|png|webp)$/i.test(contentType)) {
    throw new Error("Solo se permiten imágenes JPEG, PNG o WebP");
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(raw, "base64");
  } catch {
    throw new Error("Imagen inválida");
  }

  if (buffer.length > MAX_BYTES) {
    throw new Error("La imagen es muy grande. Usa una foto más pequeña o recorta antes de publicar.");
  }

  if (buffer.length < 32) {
    throw new Error("Imagen vacía o corrupta");
  }

  return `data:${contentType};base64,${raw}`;
}

export function assertPostImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  const trimmed = imageUrl.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    if (trimmed.length > 2048) throw new Error("URL de imagen demasiado larga");
    return trimmed;
  }
  return prepareCommunityImage(trimmed);
}
