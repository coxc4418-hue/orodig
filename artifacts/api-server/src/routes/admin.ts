import { Router, type IRouter } from "express";
import { db, withdrawalsTable, membersTable, productsTable, earningsTable, depositsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import { z } from "zod";

const router: IRouter = Router();

// Admin middleware: only username === "admin" or explicit admin check
async function requireAdmin(req: AuthRequest, res: any, next: any): Promise<void> {
  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, req.memberId!));
  if (!member || member.username !== "admin") {
    res.status(403).json({ error: "Acceso denegado — solo administradores" });
    return;
  }
  next();
}

// GET /admin/withdrawals — all withdrawals with member info
router.get("/admin/withdrawals", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  const withdrawals = await db.select().from(withdrawalsTable).orderBy(desc(withdrawalsTable.createdAt));
  const members = await db.select().from(membersTable);
  const memberMap = Object.fromEntries(members.map(m => [m.id, { fullName: m.fullName, username: m.username }]));
  res.json(withdrawals.map(w => ({
    id: w.id,
    memberId: w.memberId,
    memberName: memberMap[w.memberId]?.fullName ?? "Desconocido",
    memberUsername: memberMap[w.memberId]?.username ?? "",
    amount: parseFloat(w.amount),
    method: w.method,
    accountDetails: w.accountDetails,
    status: w.status,
    notes: w.notes,
    createdAt: w.createdAt.toISOString(),
  })));
});

const UpdateWithdrawalBody = z.object({
  status: z.enum(["approved", "rejected", "paid"]),
  notes: z.string().nullable().optional(),
});

// PATCH /admin/withdrawals/:id — approve/reject/mark paid
router.patch("/admin/withdrawals/:id", requireAuth, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdateWithdrawalBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [withdrawal] = await db.select().from(withdrawalsTable).where(eq(withdrawalsTable.id, id));
  if (!withdrawal) { res.status(404).json({ error: "Retiro no encontrado" }); return; }

  // If rejecting, refund balance to member
  if (parsed.data.status === "rejected" && withdrawal.status === "pending") {
    const [member] = await db.select().from(membersTable).where(eq(membersTable.id, withdrawal.memberId));
    if (member) {
      await db.update(membersTable).set({
        balance: (parseFloat(member.balance) + parseFloat(withdrawal.amount)).toString(),
      }).where(eq(membersTable.id, withdrawal.memberId));
    }
  }

  const [updated] = await db.update(withdrawalsTable).set({
    status: parsed.data.status,
    notes: parsed.data.notes ?? null,
  }).where(eq(withdrawalsTable.id, id)).returning();

  res.json({
    id: updated.id,
    memberId: updated.memberId,
    amount: parseFloat(updated.amount),
    method: updated.method,
    accountDetails: updated.accountDetails,
    status: updated.status,
    notes: updated.notes,
    createdAt: updated.createdAt.toISOString(),
  });
});

// GET /admin/deposits — list all deposits with member info
router.get("/admin/deposits", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  const deposits = await db.select().from(depositsTable).orderBy(desc(depositsTable.createdAt));
  const members = await db.select().from(membersTable);
  const memberMap = Object.fromEntries(members.map(m => [m.id, { fullName: m.fullName, username: m.username }]));
  res.json(deposits.map(d => ({
    id: d.id,
    memberId: d.memberId,
    memberName: memberMap[d.memberId]?.fullName ?? "Desconocido",
    memberUsername: memberMap[d.memberId]?.username ?? "",
    amount: parseFloat(d.amount),
    method: d.method,
    referenceNumber: d.referenceNumber,
    status: d.status,
    notes: d.notes,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  })));
});

const UpdateDepositBody = z.object({
  status: z.enum(["approved", "rejected"]),
  notes: z.string().nullable().optional(),
});

// PATCH /admin/deposits/:id — approve or reject a deposit
router.patch("/admin/deposits/:id", requireAuth, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdateDepositBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [deposit] = await db.select().from(depositsTable).where(eq(depositsTable.id, id));
  if (!deposit) { res.status(404).json({ error: "Depósito no encontrado" }); return; }

  // Lógica de aprobación: acreditar balance al miembro
  if (parsed.data.status === "approved" && deposit.status === "pending") {
    const [member] = await db.select().from(membersTable).where(eq(membersTable.id, deposit.memberId));
    if (member) {
      await db.update(membersTable).set({
        balance: (parseFloat(member.balance) + parseFloat(deposit.amount)).toString(),
      }).where(eq(membersTable.id, deposit.memberId));
    }
  }

  const [updated] = await db.update(depositsTable).set({
    status: parsed.data.status,
    notes: parsed.data.notes ?? null,
    updatedAt: new Date(),
  }).where(eq(depositsTable.id, id)).returning();

  res.json({
    id: updated.id,
    memberId: updated.memberId,
    amount: parseFloat(updated.amount),
    method: updated.method,
    referenceNumber: updated.referenceNumber,
    status: updated.status,
    notes: updated.notes,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
});


const ProductBody = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.number().positive(),
  pointsReward: z.number().positive(),
  category: z.string().min(1),
  imageUrl: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

// GET /admin/products — all products including inactive
router.get("/admin/products", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  const products = await db.select().from(productsTable);
  res.json(products.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: parseFloat(p.price),
    pointsReward: parseFloat(p.pointsReward),
    category: p.category,
    imageUrl: p.imageUrl,
    isActive: p.isActive,
  })));
});

// POST /admin/products — create product
router.post("/admin/products", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  const parsed = ProductBody.safeParse(_req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { name, description, price, pointsReward, category, imageUrl, isActive } = parsed.data;
  const [product] = await db.insert(productsTable).values({
    name, description,
    price: price.toString(),
    pointsReward: pointsReward.toString(),
    category,
    imageUrl: imageUrl ?? null,
    isActive: isActive ?? true,
  }).returning();
  res.status(201).json({ ...product, price: parseFloat(product.price), pointsReward: parseFloat(product.pointsReward) });
});

// PATCH /admin/products/:id — update product
router.patch("/admin/products/:id", requireAuth, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = ProductBody.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.price !== undefined) updates.price = parsed.data.price.toString();
  if (parsed.data.pointsReward !== undefined) updates.pointsReward = parsed.data.pointsReward.toString();
  if (parsed.data.category !== undefined) updates.category = parsed.data.category;
  if (parsed.data.imageUrl !== undefined) updates.imageUrl = parsed.data.imageUrl;
  if (parsed.data.isActive !== undefined) updates.isActive = parsed.data.isActive;
  const [updated] = await db.update(productsTable).set(updates).where(eq(productsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Producto no encontrado" }); return; }
  res.json({ ...updated, price: parseFloat(updated.price), pointsReward: parseFloat(updated.pointsReward) });
});

// GET /admin/members — all members with full stats
router.get("/admin/members", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  const members = await db.select().from(membersTable);
  res.json(members.map(m => ({
    id: m.id,
    username: m.username,
    fullName: m.fullName,
    email: m.email,
    phone: m.phone,
    referralCode: m.referralCode,
    rank: m.rank,
    balance: parseFloat(m.balance),
    points: parseFloat(m.points),
    totalEarnings: parseFloat(m.totalEarnings),
    directReferrals: m.directReferrals,
    totalNetwork: m.totalNetwork,
    isActive: m.isActive,
    sponsorId: m.sponsorId,
    createdAt: m.createdAt.toISOString(),
  })));
});

const UpdateMemberBody = z.object({
  rank: z.enum(["Bronce", "Plata", "Oro", "Platino", "Diamante", "Embajador"]).optional(),
  isActive: z.boolean().optional(),
  balance: z.number().nonnegative().optional(),
});

// PATCH /admin/members/:id
router.patch("/admin/members/:id", requireAuth, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateMemberBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const updates: Record<string, unknown> = {};
  if (parsed.data.rank !== undefined) updates.rank = parsed.data.rank;
  if (parsed.data.isActive !== undefined) updates.isActive = parsed.data.isActive;
  if (parsed.data.balance !== undefined) updates.balance = parsed.data.balance.toString();
  if (Object.keys(updates).length === 0) { res.status(400).json({ error: "Nothing to update" }); return; }
  const [updated] = await db.update(membersTable).set(updates).where(eq(membersTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Miembro no encontrado" }); return; }
  res.json({ id: updated.id, username: updated.username, rank: updated.rank, isActive: updated.isActive, balance: parseFloat(updated.balance) });
});

// GET /admin/stats — global platform stats
router.get("/admin/stats", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  const members = await db.select().from(membersTable);
  const withdrawals = await db.select().from(withdrawalsTable);
  const earnings = await db.select().from(earningsTable);

  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.isActive).length;
  const totalPaid = withdrawals.filter(w => w.status === "paid").reduce((s, w) => s + parseFloat(w.amount), 0);
  const pendingWithdrawals = withdrawals.filter(w => w.status === "pending").length;
  const pendingAmount = withdrawals.filter(w => w.status === "pending").reduce((s, w) => s + parseFloat(w.amount), 0);
  const totalVolume = earnings.reduce((s, e) => s + parseFloat(e.amount), 0);

  res.json({
    totalMembers,
    activeMembers,
    totalPaid,
    pendingWithdrawals,
    pendingAmount,
    totalVolume,
    rankBreakdown: Object.fromEntries(
      ["Bronce", "Plata", "Oro", "Platino", "Diamante", "Embajador"].map(rank => [
        rank, members.filter(m => m.rank === rank).length
      ])
    ),
  });
});

export default router;
