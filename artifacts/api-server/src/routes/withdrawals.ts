import { Router, type IRouter } from "express";
import { db, withdrawalsTable, membersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import { CreateWithdrawalBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/withdrawals", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const withdrawals = await db.select().from(withdrawalsTable)
    .where(eq(withdrawalsTable.memberId, req.memberId!))
    .orderBy(desc(withdrawalsTable.createdAt));
  res.json(withdrawals.map((w) => ({
    id: w.id,
    memberId: w.memberId,
    amount: parseFloat(w.amount),
    method: w.method,
    accountDetails: w.accountDetails,
    status: w.status,
    notes: w.notes,
    createdAt: w.createdAt.toISOString(),
  })));
});

router.post("/withdrawals", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateWithdrawalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { amount, method, accountDetails } = parsed.data;
  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, req.memberId!));
  if (!member) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (parseFloat(member.balance) < amount) {
    res.status(400).json({ error: "Saldo insuficiente" });
    return;
  }

  const [withdrawal] = await db.insert(withdrawalsTable).values({
    memberId: req.memberId!,
    amount: amount.toString(),
    method,
    accountDetails: accountDetails ?? null,
    status: "pending",
  }).returning();

  // Deduct from balance
  await db.update(membersTable).set({
    balance: (parseFloat(member.balance) - amount).toString(),
  }).where(eq(membersTable.id, req.memberId!));

  res.status(201).json({
    id: withdrawal.id,
    memberId: withdrawal.memberId,
    amount: parseFloat(withdrawal.amount),
    method: withdrawal.method,
    accountDetails: withdrawal.accountDetails,
    status: withdrawal.status,
    notes: withdrawal.notes,
    createdAt: withdrawal.createdAt.toISOString(),
  });
});

export default router;
