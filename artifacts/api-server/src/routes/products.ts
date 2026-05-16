import { Router, type IRouter } from "express";
import { db, productsTable, purchasesTable, membersTable, earningsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import { CreatePurchaseBody } from "@workspace/api-zod";
import { checkAndUpgradeRank } from "../lib/rankHelper";

const router: IRouter = Router();

router.get("/products", requireAuth, async (_req, res): Promise<void> => {
  const products = await db.select().from(productsTable);
  res.json(products.map((p) => ({
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

router.get("/purchases", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const purchases = await db.select().from(purchasesTable)
    .where(eq(purchasesTable.memberId, req.memberId!))
    .orderBy(desc(purchasesTable.createdAt));

  const allProducts = await db.select().from(productsTable);
  const productMap = Object.fromEntries(allProducts.map(p => [p.id, p.name]));

  res.json(purchases.map((p) => ({
    id: p.id,
    memberId: p.memberId,
    productId: p.productId,
    productName: productMap[p.productId] ?? "Producto eliminado",
    quantity: p.quantity,
    totalPrice: parseFloat(p.totalPrice),
    pointsEarned: parseFloat(p.pointsEarned),
    createdAt: p.createdAt.toISOString(),
  })));
});

router.post("/purchases", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreatePurchaseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { productId, quantity } = parsed.data;

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
  if (!product || !product.isActive) {
    res.status(404).json({ error: "Producto no encontrado" });
    return;
  }

  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, req.memberId!));
  if (!member) { res.status(401).json({ error: "Unauthorized" }); return; }

  const totalPrice = parseFloat(product.price) * quantity;
  const pointsEarned = parseFloat(product.pointsReward) * quantity;

  if (parseFloat(member.balance) < totalPrice) {
    res.status(400).json({ error: `Saldo insuficiente. Necesitas $${totalPrice.toFixed(2)} y tienes $${parseFloat(member.balance).toFixed(2)}` });
    return;
  }

  const [purchase] = await db.insert(purchasesTable).values({
    memberId: req.memberId!,
    productId,
    quantity,
    totalPrice: totalPrice.toString(),
    pointsEarned: pointsEarned.toString(),
  }).returning();

  // Deduct price, add 10% cashback as earning, add points
  const cashback = totalPrice * 0.10;
  await db.update(membersTable).set({
    balance: (parseFloat(member.balance) - totalPrice + cashback).toString(),
    points: (parseFloat(member.points) + pointsEarned).toString(),
    totalEarnings: (parseFloat(member.totalEarnings) + cashback).toString(),
  }).where(eq(membersTable.id, req.memberId!));

  await db.insert(earningsTable).values({
    memberId: req.memberId!,
    type: "purchases",
    description: `Cashback 10% — ${product.name} x${quantity}`,
    amount: cashback.toString(),
    status: "confirmed",
  });

  await checkAndUpgradeRank(req.memberId!);

  // Sponsor gets 10% sales commission
  if (member.sponsorId) {
    const commission = totalPrice * 0.10;
    const [sponsor] = await db.select().from(membersTable).where(eq(membersTable.id, member.sponsorId));
    if (sponsor) {
      await db.insert(earningsTable).values({
        memberId: member.sponsorId,
        type: "sales",
        description: `Comisión ventas — ${member.fullName} compró ${product.name}`,
        amount: commission.toString(),
        status: "confirmed",
        relatedMemberId: req.memberId!,
      });
      await db.update(membersTable).set({
        balance: (parseFloat(sponsor.balance) + commission).toString(),
        totalEarnings: (parseFloat(sponsor.totalEarnings) + commission).toString(),
        points: (parseFloat(sponsor.points) + commission * 1.5).toString(),
      }).where(eq(membersTable.id, member.sponsorId));
      await checkAndUpgradeRank(member.sponsorId);
    }
  }

  res.status(201).json({
    id: purchase.id,
    memberId: purchase.memberId,
    productId: purchase.productId,
    productName: product.name,
    quantity: purchase.quantity,
    totalPrice: parseFloat(purchase.totalPrice),
    pointsEarned: parseFloat(purchase.pointsEarned),
    createdAt: purchase.createdAt.toISOString(),
  });
});

export default router;
