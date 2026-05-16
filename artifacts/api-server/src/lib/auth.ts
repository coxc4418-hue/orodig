import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SESSION_SECRET || "orodig-pts-secret-2024";

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
