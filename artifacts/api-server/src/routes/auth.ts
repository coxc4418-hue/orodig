import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, membersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken } from "../lib/auth";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import { LoginBody, RegisterBody, GetMeResponse } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function generateReferralCode(username: string): string {
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${username.toUpperCase().slice(0, 4)}${rand}`;
}

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
    createdAt: m.createdAt.toISOString(),
  };
}

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { username, password } = parsed.data;
  const [member] = await db.select().from(membersTable).where(eq(membersTable.username, username));
  if (!member) {
    res.status(401).json({ error: "Credenciales inválidas" });
    return;
  }
  const valid = await bcrypt.compare(password, member.password);
  if (!valid) {
    res.status(401).json({ error: "Credenciales inválidas" });
    return;
  }
  const token = signToken({ memberId: member.id, username: member.username });
  res.json({ member: formatMember(member), token });
});

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { username, password, fullName, email, phone, referralCode } = parsed.data;

  const [existing] = await db.select().from(membersTable).where(eq(membersTable.username, username));
  if (existing) {
    res.status(400).json({ error: "El nombre de usuario ya existe" });
    return;
  }

  let sponsorId: number | null = null;
  if (referralCode) {
    const [sponsor] = await db.select().from(membersTable).where(eq(membersTable.referralCode, referralCode));
    if (!sponsor) {
      res.status(400).json({ error: "Código de referido no válido" });
      return;
    }
    sponsorId = sponsor.id;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newReferralCode = generateReferralCode(username);

  const [member] = await db.insert(membersTable).values({
    username,
    password: hashedPassword,
    fullName,
    email,
    phone: phone ?? null,
    referralCode: newReferralCode,
    sponsorId,
    rank: "Bronce",
    balance: "0",
    points: "0",
    totalEarnings: "0",
    directReferrals: 0,
    totalNetwork: 0,
    isActive: true,
  }).returning();

  if (sponsorId) {
    await db.update(membersTable).set({
      directReferrals: (existing?.directReferrals ?? 0) + 1,
    }).where(eq(membersTable.id, sponsorId));
  }

  const token = signToken({ memberId: member.id, username: member.username });
  logger.info({ memberId: member.id }, "New member registered");
  res.status(201).json({ member: formatMember(member), token });
});

router.get("/auth/me", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, req.memberId!));
  if (!member) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  let sponsorName: string | null = null;
  if (member.sponsorId) {
    const [sponsor] = await db.select().from(membersTable).where(eq(membersTable.id, member.sponsorId));
    sponsorName = sponsor?.fullName ?? null;
  }
  res.json(GetMeResponse.parse(formatMember(member, sponsorName)));
});

router.post("/auth/logout", (_req, res): void => {
  res.json({ success: true });
});

export default router;
