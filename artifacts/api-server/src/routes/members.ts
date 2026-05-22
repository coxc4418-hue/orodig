import { Router, type IRouter } from "express";
import { db, membersTable, earningsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";

const router: IRouter = Router();

function formatMember(m: typeof membersTable.$inferSelect, sponsorName?: string | null) {
  return {
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
    sponsorName: sponsorName ?? null,
    avatarUrl: m.avatarUrl,
    coverUrl: m.coverUrl ?? null,
    createdAt: m.createdAt.toISOString(),
  };
}

router.get("/members", requireAuth, async (_req, res): Promise<void> => {
  const members = await db.select().from(membersTable);
  res.json(members.map((m) => formatMember(m)));
});

router.get("/members/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, id));
  if (!member) { res.status(404).json({ error: "Member not found" }); return; }
  let sponsorName: string | null = null;
  if (member.sponsorId) {
    const [sponsor] = await db.select().from(membersTable).where(eq(membersTable.id, member.sponsorId));
    sponsorName = sponsor?.fullName ?? null;
  }
  res.json(formatMember(member, sponsorName));
});

router.get("/members/:id/earnings", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const earnings = await db.select().from(earningsTable).where(eq(earningsTable.memberId, id));
  const members = await db.select().from(membersTable);
  const memberMap = Object.fromEntries(members.map((m) => [m.id, m.fullName]));
  res.json(earnings.map((e) => ({
    id: e.id,
    memberId: e.memberId,
    type: e.type,
    description: e.description,
    amount: parseFloat(e.amount),
    status: e.status,
    relatedMemberId: e.relatedMemberId,
    relatedMemberName: e.relatedMemberId ? (memberMap[e.relatedMemberId] ?? null) : null,
    createdAt: e.createdAt.toISOString(),
  })));
});

export default router;
