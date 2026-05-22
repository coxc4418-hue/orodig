/**
 * Returns the API base URL.
 * In production, points to the Render backend.
 * In development, uses relative URLs (proxied by Vite).
 */
export function getApiBase(): string {
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL || "https://orodig.onrender.com";
  }
  return "";
}
