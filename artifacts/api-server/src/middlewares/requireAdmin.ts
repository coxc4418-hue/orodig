import { db, membersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { AuthRequest } from "./requireAuth";

export async function requireAdmin(req: AuthRequest, res: any, next: any): Promise<void> {
  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, req.memberId!));
  if (!member || member.username !== "admin") {
    res.status(403).json({ error: "Acceso denegado — solo administradores" });
    return;
  }
  next();
}
