import { db, membersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
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

// Rank thresholds based on total earnings
const RANK_THRESHOLDS = [
  { rank: "Bronce",             next: "Cobre",             threshold: 50 },
  { rank: "Cobre",              next: "Crisolito",          threshold: 150 },
  { rank: "Crisolito",          next: "Belirio Rojo",       threshold: 350 },
  { rank: "Belirio Rojo",       next: "Tanzanita Verde",    threshold: 700 },
  { rank: "Tanzanita Verde",    next: "Plata",              threshold: 1200 },
  { rank: "Plata",              next: "Oro",                threshold: 2500 },
  { rank: "Oro",                next: "Esmeralda Azul",     threshold: 5000 },
  { rank: "Esmeralda Azul",     next: "Esmeralda Verde",    threshold: 9000 },
  { rank: "Esmeralda Verde",    next: "Diamante Azul",      threshold: 15000 },
  { rank: "Diamante Azul",      next: "Danzanita Verde",    threshold: 23000 },
  { rank: "Danzanita Verde",    next: "Diamante Fantasía",  threshold: 33000 },
  { rank: "Diamante Fantasía",  next: "Zafiro Amarillo",    threshold: 48000 },
  { rank: "Zafiro Amarillo",    next: "Alejandrita Especial", threshold: 70000 },
  { rank: "Alejandrita Especial", next: "Accionista ORODIG", threshold: 100000 },
];

export async function checkAndUpgradeRank(memberId: number): Promise<string | null> {
  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, memberId));
  if (!member) return null;
  const entry = RANK_THRESHOLDS.find((r) => r.rank === member.rank);
  if (entry && parseFloat(member.totalEarnings) >= entry.threshold) {
    await db.update(membersTable).set({ rank: entry.next }).where(eq(membersTable.id, memberId));
    return entry.next;
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
