import { db, membersTable, purchasesTable, productsTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { earningsTable } from "@workspace/db";

export const RANK_LIST = [
  "Bronce",
  "Cobre",
  "Crisolito",
  "Belirio Rojo",
  "Tanzanita Verde",
  "Plata",
  "Oro",
  "Esmeralda Azul",
  "Esmeralda Verde",
  "Diamante Azul",
  "Danzanita Verde",
  "Diamante Fantasía",
  "Zafiro Amarillo",
  "Alejandrita Especial",
  "Accionista ORODIG",
] as const;

export type RankName = typeof RANK_LIST[number];

// Bonus value per referred member per rank (USD)
export const RANK_BONUS: Record<string, number> = {
  "Bronce": 12,
  "Cobre": 15,
  "Crisolito": 18,
  "Belirio Rojo": 20,
  "Tanzanita Verde": 24,
  "Plata": 30,
  "Oro": 40,
  "Esmeralda Azul": 50,
  "Esmeralda Verde": 60,
  "Diamante Azul": 70,
  "Danzanita Verde": 80,
  "Diamante Fantasía": 80,
  "Zafiro Amarillo": 100,
  "Alejandrita Especial": 120,
  "Accionista ORODIG": 200,
};

const PRODUCT_WEIGHTS: Record<string, number> = {
  "Suscripción": 1,
  "Pequeño Aprendiz": 2,
  "Mediano Liderazgo": 3,
  "Gran Líder": 4,
  "Director de Líderes": 5,
  "Director de Directores": 6,
  "Director de Zonas": 7,
  "Director de Países": 8,
};

export async function checkAndUpgradeRank(memberId: number): Promise<string | null> {
  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, memberId));
  if (!member) return null;

  // Find all direct referrals
  const referrals = await db.select().from(membersTable).where(eq(membersTable.sponsorId, memberId));
  if (referrals.length === 0) return null;

  const referralIds = referrals.map((r: any) => r.id);

  // Find all purchases made by direct referrals
  const purchases = await db.select().from(purchasesTable).where(inArray(purchasesTable.memberId, referralIds));
  const products = (await db.select().from(productsTable)) as any[];
  const productMap = new Map(products.map((p: any) => [p.id, p]));

  const referralHighestPackageWeight = new Map<number, number>();
  for (const referral of referrals) {
    referralHighestPackageWeight.set(referral.id, 0);
  }

  for (const purchase of purchases) {
    const prod = productMap.get(purchase.productId);
    if (prod) {
      const weight = PRODUCT_WEIGHTS[prod.name] ?? 0;
      const currentMax = referralHighestPackageWeight.get(purchase.memberId) ?? 0;
      if (weight > currentMax) {
        referralHighestPackageWeight.set(purchase.memberId, weight);
      }
    }
  }

  const counts = {
    subscriptionOrHigher: 0,
    pequenoOrHigher: 0,
    medianoOrHigher: 0,
    granOrHigher: 0,
    dirLideresOrHigher: 0,
    dirDirectoresOrHigher: 0,
    dirZonasOrHigher: 0,
    dirPaisesOrHigher: 0,
  };

  for (const [_, weight] of referralHighestPackageWeight.entries()) {
    if (weight >= 1) counts.subscriptionOrHigher++;
    if (weight >= 2) counts.pequenoOrHigher++;
    if (weight >= 3) counts.medianoOrHigher++;
    if (weight >= 4) counts.granOrHigher++;
    if (weight >= 5) counts.dirLideresOrHigher++;
    if (weight >= 6) counts.dirDirectoresOrHigher++;
    if (weight >= 7) counts.dirZonasOrHigher++;
    if (weight >= 8) counts.dirPaisesOrHigher++;
  }

  const ranksHierarchy = [
    { rank: "Accionista ORODIG", check: () => counts.subscriptionOrHigher >= 1 && counts.pequenoOrHigher >= 1 && counts.medianoOrHigher >= 1 && counts.granOrHigher >= 1 && counts.dirLideresOrHigher >= 1 && counts.dirDirectoresOrHigher >= 1 && counts.dirZonasOrHigher >= 1 && counts.dirPaisesOrHigher >= 1 },
    { rank: "Alejandrita Especial", check: () => counts.dirPaisesOrHigher >= 1 },
    { rank: "Zafiro Amarillo", check: () => counts.dirZonasOrHigher >= 1 },
    { rank: "Diamante Fantasía", check: () => counts.dirDirectoresOrHigher >= 1 },
    { rank: "Danzanita Verde", check: () => counts.dirLideresOrHigher >= 2 },
    { rank: "Diamante Azul", check: () => counts.dirLideresOrHigher >= 1 },
    { rank: "Esmeralda Verde", check: () => counts.granOrHigher >= 1 },
    { rank: "Esmeralda Azul", check: () => counts.medianoOrHigher >= 1 },
    { rank: "Oro", check: () => counts.pequenoOrHigher >= 10 },
    { rank: "Plata", check: () => counts.pequenoOrHigher >= 5 },
    { rank: "Tanzanita Verde", check: () => counts.subscriptionOrHigher >= 10 },
    { rank: "Belirio Rojo", check: () => counts.subscriptionOrHigher >= 8 },
    { rank: "Crisolito", check: () => counts.subscriptionOrHigher >= 4 },
    { rank: "Cobre", check: () => counts.subscriptionOrHigher >= 2 },
    { rank: "Bronce", check: () => counts.subscriptionOrHigher >= 1 },
  ];

  let qualifiedRank: string = "Bronce";
  for (const entry of ranksHierarchy) {
    if (entry.check()) {
      qualifiedRank = entry.rank;
      break;
    }
  }

  const currentIdx = RANK_LIST.indexOf(member.rank as any);
  const qualifiedIdx = RANK_LIST.indexOf(qualifiedRank as any);

  if (qualifiedIdx > currentIdx) {
    await db.update(membersTable).set({ rank: qualifiedRank }).where(eq(membersTable.id, memberId));
    return qualifiedRank;
  }

  return null;
}

export async function addEarning(memberId: number, type: string, description: string, amount: number, relatedMemberId?: number): Promise<void> {
  await db.insert(earningsTable).values({
    memberId,
    type,
    description,
    amount: amount.toString(),
    status: "confirmed",
    relatedMemberId: relatedMemberId ?? null,
  });
  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, memberId));
  if (member) {
    const newTotal = parseFloat(member.totalEarnings) + amount;
    const newBalance = parseFloat(member.balance) + amount;
    await db.update(membersTable).set({
      totalEarnings: newTotal.toString(),
      balance: newBalance.toString(),
      points: (parseFloat(member.points) + amount * 1.5).toString(),
    }).where(eq(membersTable.id, memberId));
    await checkAndUpgradeRank(memberId);
  }
}

// Calculate membership status based on lastPaymentAt
export function getMembershipStatus(lastPaymentAt: Date | null): {
  status: "activo" | "pendiente" | "inactivo" | "eliminado";
  label: string;
  color: string;
  daysRemaining: number;
} {
  if (!lastPaymentAt) {
    return { status: "inactivo", label: "Inactivo", color: "red", daysRemaining: 0 };
  }
  const now = new Date();
  const daysSince = Math.floor((now.getTime() - lastPaymentAt.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(60 - daysSince, 0);

  if (daysSince <= 30) {
    return { status: "activo", label: "Activo", color: "green", daysRemaining: 30 - daysSince };
  } else if (daysSince <= 60) {
    return { status: "pendiente", label: "Activo Pendiente", color: "yellow", daysRemaining };
  } else if (daysSince < 180) {
    return { status: "inactivo", label: "Inactivo", color: "red", daysRemaining: 0 };
  } else {
    return { status: "eliminado", label: "Eliminado", color: "gray", daysRemaining: 0 };
  }
}
