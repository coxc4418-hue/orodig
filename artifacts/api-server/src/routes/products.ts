import { Router, type IRouter } from "express";
import { db, productsTable, purchasesTable, membersTable, earningsTable, renewalsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import { CreatePurchaseBody } from "@workspace/api-zod";
import { checkAndUpgradeRank } from "../lib/rankHelper";

const router: IRouter = Router();

router.get("/products", requireAuth, async (_req: any, res: any): Promise<void> => {
  const products = await db.select().from(productsTable);
  res.json(products.map((p: any) => ({
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

router.get("/purchases", requireAuth, async (req: any, res: any): Promise<void> => {
  const purchases = await db.select().from(purchasesTable)
    .where(eq(purchasesTable.memberId, req.memberId!))
    .orderBy(desc(purchasesTable.createdAt));

  const allProducts = await db.select().from(productsTable);
  const productMap = Object.fromEntries(allProducts.map((p: any) => [p.id, p.name]));

  res.json(purchases.map((p: any) => ({
    id: p.id,
    memberId: p.memberId,
    productId: p.productId,
    productName: productMap[p.productId] ?? "Producto eliminado",
    quantity: p.quantity,
    totalPrice: parseFloat(p.totalPrice),
    pointsEarned: parseFloat(p.pointsEarned),
    status: p.status || "pending",
    createdAt: p.createdAt.toISOString(),
  })));
});

// We keep distributeMultilevelCommissions and other helpers as is since they are used during admin approval.
async function distributeMultilevelCommissions(buyerId: number, productName: string, totalPrice: number) {
  const [buyer] = await db.select().from(membersTable).where(eq(membersTable.id, buyerId));
  if (!buyer) return;

  const safeFloat = (val: any) => val ? (parseFloat(val) || 0) : 0;

  let currentSponsorId = buyer.sponsorId;
  for (let level = 1; level <= 50; level++) {
    if (!currentSponsorId) break;

    const [sponsor] = await db.select().from(membersTable).where(eq(membersTable.id, currentSponsorId));
    if (!sponsor) break;

    // Check if sponsor is active (membership fee active)
    const status = sponsor.referralStatus || "ROJO";
    if (status === "VENCIDO" || status === "ROJO" || status === "SUSPENDIDO" || !sponsor.isActive) {
      // Sponsor is inactive/blocked: bypass them and continue up the chain
      currentSponsorId = sponsor.sponsorId;
      continue;
    }

    let pct = 0;
    let flatBonus = 0;

    if (level === 1) {
      // Direct referral commissions & bonuses as per images
      if (productName === "Suscripción") {
        flatBonus = 12;
      } else if (productName === "Pequeño Aprendiz") {
        flatBonus = 13;
      } else if (productName === "Mediano Liderazgo") {
        flatBonus = 24;
        pct = 0.12;
      } else if (productName === "Gran Líder") {
        flatBonus = 24;
        pct = 0.13;
      } else if (productName === "Director de Líderes") {
        flatBonus = 24;
        pct = 0.14;
      } else if (productName === "Director de Directores") {
        flatBonus = 24;
        pct = 0.15;
      } else if (productName === "Director de Zonas") {
        flatBonus = 24;
        pct = 0.16;
      } else if (productName === "Director de Países") {
        pct = 0.17;
      } else {
        pct = 0.10;
      }
    } else if (level === 2) {
      pct = 0.08;
    } else if (level === 3) {
      pct = 0.05;
    } else if (level >= 4 && level <= 5) {
      pct = 0.06;
    } else if (level >= 6 && level <= 8) {
      pct = 0.03;
    } else if (level >= 9 && level <= 10) {
      pct = 0.02;
    } else if (level >= 11 && level <= 50) {
      pct = 0.01;
    }

    const commissionAmount = totalPrice * pct + flatBonus;
    if (commissionAmount > 0) {
      // 1. Insert earning record
      await db.insert(earningsTable).values({
        memberId: sponsor.id,
        type: level === 1 ? "referral" : "leadership",
        description: level === 1
          ? `Bono directo — ${buyer.fullName} compró ${productName}`
          : `Comisión multinivel Lvl ${level} — ${buyer.fullName} compró ${productName}`,
        amount: commissionAmount.toFixed(2),
        status: "confirmed",
        relatedMemberId: buyerId,
      });

      // 2. Update sponsor balance, totalEarnings, points
      await db.update(membersTable).set({
        balance: (safeFloat(sponsor.balance) + commissionAmount).toString(),
        totalEarnings: (safeFloat(sponsor.totalEarnings) + commissionAmount).toString(),
        points: (safeFloat(sponsor.points) + commissionAmount * 1.5).toString(),
      }).where(eq(membersTable.id, sponsor.id));

      // 3. Upgrade rank if requirements met
      await checkAndUpgradeRank(sponsor.id);
    }

    currentSponsorId = sponsor.sponsorId;
  }
}

// Re-export distributeMultilevelCommissions to be used in admin.ts
export { distributeMultilevelCommissions };

router.post("/purchases", requireAuth, async (req: any, res: any): Promise<void> => {
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

  const safeFloat = (val: any) => val ? (parseFloat(val) || 0) : 0;
  const totalPrice = safeFloat(product.price) * quantity;
  const pointsEarned = safeFloat(product.pointsReward) * quantity;

  if (safeFloat(member.balance) < totalPrice) {
    res.status(400).json({ error: `Saldo insuficiente. Necesitas $${totalPrice.toFixed(2)} y tienes $${safeFloat(member.balance).toFixed(2)}` });
    return;
  }

  // 1. Debitar el saldo del usuario inmediatamente
  await db.update(membersTable).set({
    balance: (safeFloat(member.balance) - totalPrice).toString(),
  }).where(eq(membersTable.id, req.memberId!));

  // 2. Insertar la compra como PENDIENTE
  const [purchase] = await db.insert(purchasesTable).values({
    memberId: req.memberId!,
    productId,
    quantity,
    totalPrice: totalPrice.toString(),
    pointsEarned: pointsEarned.toString(),
    status: "pending",
  }).returning();

  res.status(201).json({
    id: purchase.id,
    memberId: purchase.memberId,
    productId: purchase.productId,
    productName: product.name,
    quantity: purchase.quantity,
    totalPrice: parseFloat(purchase.totalPrice),
    pointsEarned: parseFloat(purchase.pointsEarned),
    status: purchase.status || "pending",
    createdAt: purchase.createdAt.toISOString(),
  });
});

export default router;
