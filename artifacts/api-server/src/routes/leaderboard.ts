import { Router, type IRouter } from "express";
import { db, membersTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/leaderboard", requireAuth, async (_req, res): Promise<void> => {
  const members = await db.select().from(membersTable)
    .orderBy(desc(membersTable.totalEarnings))
    .limit(20);
  res.json(members.map((m, i) => ({
    rank: i + 1,
    memberId: m.id,
    fullName: m.fullName,
    username: m.username,
    totalEarnings: parseFloat(m.totalEarnings),
    directReferrals: m.directReferrals,
    memberRank: m.rank,
    avatarUrl: m.avatarUrl,
  })));
});

export default router;
