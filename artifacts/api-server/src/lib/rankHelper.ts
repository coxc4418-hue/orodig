import { db, membersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { earningsTable } from "@workspace/db";

const RANK_THRESHOLDS = [
  { rank: "Bronce",   next: "Plata",     threshold: 500 },
  { rank: "Plata",    next: "Oro",       threshold: 2000 },
  { rank: "Oro",      next: "Platino",   threshold: 5000 },
  { rank: "Platino",  next: "Diamante",  threshold: 15000 },
  { rank: "Diamante", next: "Embajador", threshold: 45000 },
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
