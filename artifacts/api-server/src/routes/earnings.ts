import { Router, type IRouter } from "express";
import { db, earningsTable, membersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/earnings", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const earnings = await db.select().from(earningsTable)
    .where(eq(earningsTable.memberId, req.memberId!))
    .orderBy(desc(earningsTable.createdAt));
  const members = await db.select().from(membersTable);
  const memberMap = Object.fromEntries(members.map((m) => [m.id, m.fullName]));
  res.json(earnings.map((e) => ({
    id: e.id,
    memberId: e.memberId,
    type: e.type,
    description: e.description,
    amount: parseFloat(e.amount),
    status: e.status,
    relatedMemberId: e.relatedMemberId,
    relatedMemberName: e.relatedMemberId ? (memberMap[e.relatedMemberId] ?? null) : null,
    createdAt: e.createdAt.toISOString(),
  })));
});

export default router;
