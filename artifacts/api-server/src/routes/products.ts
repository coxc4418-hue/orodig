import { Router, type IRouter } from "express";
import { db, productsTable, purchasesTable, membersTable, earningsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import { CreatePurchaseBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/products", requireAuth, async (_req, res): Promise<void> => {
  const products = await db.select().from(productsTable).where(eq(productsTable.isActive, true));
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

router.post("/purchases", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreatePurchaseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { productId, quantity } = parsed.data;
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
  if (!product || !product.isActive) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  const totalPrice = parseFloat(product.price) * quantity;
  const pointsEarned = parseFloat(product.pointsReward) * quantity;

  const [purchase] = await db.insert(purchasesTable).values({
    memberId: req.memberId!,
    productId,
    quantity,
    totalPrice: totalPrice.toString(),
    pointsEarned: pointsEarned.toString(),
  }).returning();

  // Award points to the member and record earning
  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, req.memberId!));
  if (member) {
    const newPoints = parseFloat(member.points) + pointsEarned;
    const newBalance = parseFloat(member.balance) + pointsEarned * 0.01;
    const newTotalEarnings = parseFloat(member.totalEarnings) + pointsEarned * 0.01;
    await db.update(membersTable).set({
      points: newPoints.toString(),
      balance: newBalance.toString(),
      totalEarnings: newTotalEarnings.toString(),
    }).where(eq(membersTable.id, req.memberId!));

    await db.insert(earningsTable).values({
      memberId: req.memberId!,
      type: "purchases",
      description: `Compra de ${product.name} x${quantity}`,
      amount: (pointsEarned * 0.01).toString(),
      status: "confirmed",
    });
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
