import jwt from "jsonwebtoken";

function getJwtSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET is required in production");
  }
  return "orodig-pts-secret-2024";
}

const JWT_SECRET = getJwtSecret();

export function signToken(payload: { memberId: number; username: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): { memberId: number; username: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { memberId: number; username: string };
  } catch {
    return null;
  }
}

export function extractToken(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}
