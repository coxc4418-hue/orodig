import { Router, type IRouter } from "express";
import { db, depositsTable, membersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import { CreateDepositBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/deposits", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const deposits = await db.select().from(depositsTable)
    .where(eq(depositsTable.memberId, req.memberId!))
    .orderBy(desc(depositsTable.createdAt));
  res.json(deposits.map((d) => ({
    id: d.id,
    memberId: d.memberId,
    amount: parseFloat(d.amount),
    method: d.method,
    referenceNumber: d.referenceNumber,
    status: d.status,
    notes: d.notes,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  })));
});

router.post("/deposits", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateDepositBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { amount, method, referenceNumber } = parsed.data;
  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, req.memberId!));
  if (!member) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [deposit] = await db.insert(depositsTable).values({
    memberId: req.memberId!,
    amount: amount.toString(),
    method,
    referenceNumber,
    status: "pending",
  }).returning();

  res.status(201).json({
    id: deposit.id,
    memberId: deposit.memberId,
    amount: parseFloat(deposit.amount),
    method: deposit.method,
    referenceNumber: deposit.referenceNumber,
    status: deposit.status,
    notes: deposit.notes,
    createdAt: deposit.createdAt.toISOString(),
    updatedAt: deposit.updatedAt.toISOString(),
  });
});

export default router;
