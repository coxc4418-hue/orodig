import { Router, type IRouter } from "express";
import { db, membersTable, renewalsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

// GET /api/referrals/status
router.get("/referrals/status", requireAuth, async (req: any, res: any): Promise<void> => {
  try {
    const [member] = await db.select().from(membersTable).where(eq(membersTable.id, req.memberId!));
    if (!member) {
      res.status(404).json({ error: "Miembro no encontrado" });
      return;
    }

    const now = Date.now();
    const expiresAt = member.expiresAt ? new Date(member.expiresAt).getTime() : 0;
    const msRemaining = Math.max(0, expiresAt - now);
    const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

    res.json({
      referralStatus: member.referralStatus || "ROJO",
      activatedAt: member.activatedAt ? member.activatedAt.toISOString() : null,
      expiresAt: member.expiresAt ? member.expiresAt.toISOString() : null,
      lastRepurchaseAt: member.lastRepurchaseAt ? member.lastRepurchaseAt.toISOString() : null,
      daysRemaining,
      msRemaining,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/referrals/countdown
router.get("/referrals/countdown", requireAuth, async (req: any, res: any): Promise<void> => {
  try {
    const [member] = await db.select().from(membersTable).where(eq(membersTable.id, req.memberId!));
    if (!member) {
      res.status(404).json({ error: "Miembro no encontrado" });
      return;
    }

    const now = Date.now();
    const expiresAt = member.expiresAt ? new Date(member.expiresAt).getTime() : 0;
    const secondsRemaining = Math.max(0, Math.floor((expiresAt - now) / 1000));

    res.json({
      secondsRemaining,
      expiresAt: member.expiresAt ? member.expiresAt.toISOString() : null,
      status: member.referralStatus || "ROJO",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/referrals/activate (Admin only / system activation)
router.post("/referrals/activate", requireAuth, async (req: any, res: any): Promise<void> => {
  try {
    // Basic authorization check: verify caller is admin
    const [caller] = await db.select().from(membersTable).where(eq(membersTable.id, req.memberId!));
    if (!caller || caller.username !== "admin") {
      res.status(403).json({ error: "Solo el administrador puede activar cuentas manualmente." });
      return;
    }

    const { memberId, days = 30 } = req.body;
    if (!memberId) {
      res.status(400).json({ error: "Falta el ID del miembro a activar." });
      return;
    }

    const [member] = await db.select().from(membersTable).where(eq(membersTable.id, Number(memberId)));
    if (!member) {
      res.status(404).json({ error: "Miembro a activar no existe." });
      return;
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    // Save previous expiration for renewal history
    const prevExp = member.expiresAt;

    // Update in database
    await db.update(membersTable)
      .set({
        referralStatus: "VERDE",
        activatedAt: now,
        expiresAt: expiresAt,
        lastPaymentAt: now, // Also sync core lastPaymentAt
      })
      .where(eq(membersTable.id, member.id));

    // Record the activation in renewal audit history
    await db.insert(renewalsTable).values({
      memberId: member.id,
      purchaseId: null,
      previousExpiration: prevExp,
      newExpiration: expiresAt,
    });

    res.json({
      success: true,
      message: `Miembro ${member.username} activado correctamente como VERDE por ${days} días.`,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/referrals/renew
router.post("/referrals/renew", requireAuth, async (req: any, res: any): Promise<void> => {
  try {
    const targetMemberId = req.body.memberId ? Number(req.body.memberId) : req.memberId!;
    
    // Non-admins can only renew themselves
    if (targetMemberId !== req.memberId) {
      const [caller] = await db.select().from(membersTable).where(eq(membersTable.id, req.memberId!));
      if (!caller || caller.username !== "admin") {
        res.status(403).json({ error: "No tienes permiso para renovar a otros miembros." });
        return;
      }
    }

    const [member] = await db.select().from(membersTable).where(eq(membersTable.id, targetMemberId));
    if (!member) {
      res.status(404).json({ error: "Miembro no encontrado" });
      return;
    }

    const now = new Date();
    let baseDate = now;

    // If already VERDE and not expired, extend from current expiresAt date
    if (member.referralStatus === "VERDE" && member.expiresAt && new Date(member.expiresAt).getTime() > now.getTime()) {
      baseDate = new Date(member.expiresAt);
    }

    const newExpiration = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const prevExp = member.expiresAt;

    await db.update(membersTable)
      .set({
        referralStatus: "VERDE",
        expiresAt: newExpiration,
        lastRepurchaseAt: now,
        lastPaymentAt: now,
      })
      .where(eq(membersTable.id, member.id));

    await db.insert(renewalsTable).values({
      memberId: member.id,
      purchaseId: null,
      previousExpiration: prevExp,
      newExpiration: newExpiration,
    });

    res.json({
      success: true,
      message: "Renovación aplicada correctamente.",
      expiresAt: newExpiration.toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
