import { Router, type IRouter } from "express";
import { db, membersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";

const router: IRouter = Router();

type NetworkNode = {
  id: number;
  fullName: string;
  username: string;
  rank: string;
  referralCode: string;
  directReferrals: number;
  totalEarnings: number;
  isActive: boolean;
  level: number;
  avatarUrl: string | null;
  children: NetworkNode[];
};

async function buildNetworkTree(memberId: number, level: number, maxLevel: number, allMembers: typeof membersTable.$inferSelect[]): Promise<NetworkNode> {
  const member = allMembers.find((m) => m.id === memberId);
  if (!member) throw new Error("Member not found");

  const children: NetworkNode[] = [];
  if (level < maxLevel) {
    const directChildren = allMembers.filter((m) => m.sponsorId === memberId);
    for (const child of directChildren) {
      children.push(await buildNetworkTree(child.id, level + 1, maxLevel, allMembers));
    }
  }

  return {
    id: member.id,
    fullName: member.fullName,
    username: member.username,
    rank: member.rank,
    referralCode: member.referralCode,
    directReferrals: member.directReferrals,
    totalEarnings: parseFloat(member.totalEarnings),
    isActive: member.isActive,
    level,
    avatarUrl: member.avatarUrl,
    children,
  };
}

router.get("/network/my", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const allMembers = await db.select().from(membersTable);
  const tree = await buildNetworkTree(req.memberId!, 0, 3, allMembers);
  res.json(tree);
});

router.get("/members/:id/network", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const allMembers = await db.select().from(membersTable);
  const tree = await buildNetworkTree(id, 0, 3, allMembers);
  res.json(tree);
});

export default router;
