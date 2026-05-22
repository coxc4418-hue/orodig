import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, membersTable } from "@workspace/db";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { eq } from "drizzle-orm";
import { signToken } from "../lib/auth";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import { LoginBody, RegisterBody, GetMeResponse } from "@workspace/api-zod";
import { logger } from "../lib/logger";
import { addEarning, checkAndUpgradeRank } from "../lib/rankHelper";
import { checkAndBypassInactiveSponsors } from "../lib/bypassHelper";
import { computeReferralStatus } from "../lib/membership";
import { prepareAvatarImage, prepareCoverImage } from "../lib/profileImage";
import { z } from "zod";

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
    coverUrl: m.coverUrl ?? null,
    lastPaymentAt: m.lastPaymentAt ? m.lastPaymentAt.toISOString() : null,
    referralStatus: computeReferralStatus(m.referralStatus, m.expiresAt),
    activatedAt: m.activatedAt ? m.activatedAt.toISOString() : null,
    expiresAt: m.expiresAt ? m.expiresAt.toISOString() : null,
    lastRepurchaseAt: m.lastRepurchaseAt ? m.lastRepurchaseAt.toISOString() : null,
    createdAt: m.createdAt.toISOString(),
  };
}

router.post("/auth/login", async (req: any, res: any): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { username, password } = parsed.data;

  // Re-build any inactive sponsor branches before fetching the member
  await checkAndBypassInactiveSponsors();

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

router.post("/auth/register", async (req: any, res: any): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { username, password, fullName, email, phone, referralCode } = parsed.data;

  if (!(req.body as { acceptTerms?: boolean }).acceptTerms) {
    res.status(400).json({ error: "Debes aceptar los términos y la política de privacidad" });
    return;
  }

  const [existingUser] = await db.select().from(membersTable).where(eq(membersTable.username, username));
  if (existingUser) {
    res.status(400).json({ error: "El nombre de usuario ya existe" });
    return;
  }

  let sponsorId: number | null = null;
  let sponsor: typeof membersTable.$inferSelect | null = null;

  if (referralCode) {
    const [found] = await db.select().from(membersTable).where(eq(membersTable.referralCode, referralCode));
    if (!found) {
      res.status(400).json({ error: "Código de referido no válido" });
      return;
    }
    sponsorId = found.id;
    sponsor = found;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newReferralCode = generateReferralCode(username);

  // 1. Create User in Firebase Authentication
  let firebaseUid = "";
  try {
    const authInstance = getAuth();
    const userCred = await createUserWithEmailAndPassword(authInstance, email, password);
    firebaseUid = userCred.user.uid;
    // Sign out from the client session on the server to prevent leakage
    await authInstance.signOut();
  } catch (authError: any) {
    logger.warn({ email, error: authError.message }, "Error creating Firebase Auth user during registration");
    if (authError.code === "auth/email-already-in-use") {
      res.status(400).json({ error: "El correo electrónico ya está registrado en Firebase" });
      return;
    }
    res.status(400).json({ error: `Error en Firebase Auth: ${authError.message}` });
    return;
  }

  // 2. Insert into Firestore members table
  const [member] = await db.insert(membersTable).values({
    firebaseUid,
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

  if (sponsor && sponsorId) {
    // Fix: use sponsor.directReferrals (not the old `existing` variable)
    await db.update(membersTable).set({
      directReferrals: sponsor.directReferrals + 1,
      totalNetwork: sponsor.totalNetwork + 1,
    }).where(eq(membersTable.id, sponsorId));

    // Give sponsor a referral bonus earning ($50)
    await addEarning(sponsorId, "referral", `Bono referido - ${fullName}`, 50, member.id);

    // Walk up the chain and give leadership bonuses (10% to upline level 2)
    if (sponsor.sponsorId) {
      await addEarning(sponsor.sponsorId, "leadership", `Bono liderazgo - nuevo miembro en red`, 15, member.id);
      // Update upline network count
      const [grandSponsor] = await db.select().from(membersTable).where(eq(membersTable.id, sponsor.sponsorId));
      if (grandSponsor) {
        await db.update(membersTable).set({
          totalNetwork: grandSponsor.totalNetwork + 1,
        }).where(eq(membersTable.id, grandSponsor.id));
      }
    }
  }

  const token = signToken({ memberId: member.id, username: member.username });
  logger.info({ memberId: member.id }, "New member registered");
  res.status(201).json({ member: formatMember(member, sponsor?.fullName ?? null), token });
});

router.get("/auth/me", requireAuth, async (req: any, res: any): Promise<void> => {
  // Re-build inactive sponsor branches so the UI is up-to-date
  await checkAndBypassInactiveSponsors();

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

const UpdateProfileBody = z.object({
  fullName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().nullable().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
  avatarUrl: z.string().nullable().optional(),
  coverUrl: z.string().nullable().optional(),
});

router.put("/auth/profile", requireAuth, async (req: any, res: any): Promise<void> => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { fullName, email, phone, currentPassword, newPassword, avatarUrl, coverUrl } = parsed.data;

  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, req.memberId!));
  if (!member) {
    res.status(404).json({ error: "Member not found" });
    return;
  }

  const updates: Partial<typeof membersTable.$inferInsert> = {};
  if (fullName) updates.fullName = fullName;
  if (email) updates.email = email;
  if (phone !== undefined) updates.phone = phone;
  if (avatarUrl !== undefined) {
    try {
      updates.avatarUrl = avatarUrl ? prepareAvatarImage(avatarUrl) : null;
    } catch (err: any) {
      res.status(400).json({ error: err.message });
      return;
    }
  }
  if (coverUrl !== undefined) {
    try {
      updates.coverUrl = coverUrl ? prepareCoverImage(coverUrl) : null;
    } catch (err: any) {
      res.status(400).json({ error: err.message });
      return;
    }
  }


  if (newPassword) {
    if (!currentPassword) {
      res.status(400).json({ error: "Se requiere la contraseña actual" });
      return;
    }
    const valid = await bcrypt.compare(currentPassword, member.password);
    if (!valid) {
      res.status(400).json({ error: "Contraseña actual incorrecta" });
      return;
    }
    updates.password = await bcrypt.hash(newPassword, 10);
  }

  if (Object.keys(updates).length === 0) {
    res.json(formatMember(member));
    return;
  }

  await db.update(membersTable).set(updates).where(eq(membersTable.id, req.memberId!));
  const [updated] = await db.select().from(membersTable).where(eq(membersTable.id, req.memberId!));
  let sponsorName: string | null = null;
  if (updated.sponsorId) {
    const [sponsor] = await db.select().from(membersTable).where(eq(membersTable.id, updated.sponsorId));
    sponsorName = sponsor?.fullName ?? null;
  }
  res.json(formatMember(updated, sponsorName));
});

router.post("/auth/logout", (_req: any, res: any): void => {
  res.json({ success: true });
});

const ForgotPasswordBody = z.object({
  email: z.string().email(),
});

router.post("/auth/forgot-password", async (req: any, res: any): Promise<void> => {
  const parsed = ForgotPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [member] = await db.select().from(membersTable).where(eq(membersTable.email, parsed.data.email));
  if (!member) {
    res.json({ success: true, message: "Si el correo existe, recibirás un enlace de recuperación." });
    return;
  }

  try {
    const { createRequire } = await import("node:module");
    const require = createRequire(import.meta.url);
    const { initializeApp, getApps, cert } = require("firebase-admin/app");
    const { getAuth } = require("firebase-admin/auth");

    if (!getApps().length && process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      initializeApp({
        credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)),
        projectId: process.env.FIREBASE_PROJECT_ID || "oro-dig",
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || "https://oro-dig.web.app";
    const link = await getAuth().generatePasswordResetLink(parsed.data.email, {
      url: `${frontendUrl}/`,
    });

    const { sendNotificationEmail } = await import("../lib/notify.js");
    await sendNotificationEmail({
      to: parsed.data.email,
      subject: "Restablecer contraseña — ORODIG PTS",
      html: `<p>Hola ${member.fullName},</p><p><a href="${link}">Haz clic aquí para restablecer tu contraseña</a>.</p><p>Si no solicitaste esto, ignora este mensaje.</p>`,
    });

    res.json({ success: true, message: "Si el correo existe, recibirás un enlace de recuperación." });
  } catch (err: any) {
    logger.error({ err }, "forgot-password failed");
    res.status(500).json({ error: "No se pudo enviar el correo de recuperación. Contacta soporte." });
  }
});

export default router;
