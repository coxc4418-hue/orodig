import { Request, Response, NextFunction } from "express";
import { extractToken, verifyToken } from "../lib/auth";

export interface AuthRequest extends Request {
  memberId?: number;
  memberUsername?: string;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = extractToken(req.headers.authorization);
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
  req.memberId = payload.memberId;
  req.memberUsername = payload.username;
  next();
}
