import { Router, type IRouter } from "express";
import { db, membersTable, earningsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/dashboard/summary", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, req.memberId!));
  if (!member) { res.status(401).json({ error: "Unauthorized" }); return; }

  const earningRows = await db.select().from(earningsTable).where(eq(earningsTable.memberId, req.memberId!));
  
  const earningsByType = { referral: 0, sales: 0, purchases: 0, leadership: 0, work: 0, passive: 0 };
  for (const e of earningRows) {
    const t = e.type as keyof typeof earningsByType;
    if (t in earningsByType) earningsByType[t] += parseFloat(e.amount);
  }

  // Monthly earnings (last 6 months)
  const monthlyMap: Record<string, number> = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString("es", { month: "short", year: "2-digit" });
    monthlyMap[key] = 0;
  }
  for (const e of earningRows) {
    const d = new Date(e.createdAt);
    const key = d.toLocaleString("es", { month: "short", year: "2-digit" });
    if (key in monthlyMap) monthlyMap[key] += parseFloat(e.amount);
  }
  const monthlyEarnings = Object.entries(monthlyMap).map(([month, amount]) => ({ month, amount }));

  res.json({
    balance: parseFloat(member.balance),
    points: parseFloat(member.points),
    totalEarnings: parseFloat(member.totalEarnings),
    directReferrals: member.directReferrals,
    totalNetwork: member.totalNetwork,
    rank: member.rank,
    earningsByType,
    monthlyEarnings,
  });
});

router.get("/dashboard/activity", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const earnings = await db.select().from(earningsTable)
    .where(eq(earningsTable.memberId, req.memberId!))
    .orderBy(desc(earningsTable.createdAt))
    .limit(10);

  res.json(earnings.map((e) => ({
    id: e.id,
    type: e.type,
    description: e.description,
    amount: parseFloat(e.amount),
    createdAt: e.createdAt.toISOString(),
  })));
});

export default router;
