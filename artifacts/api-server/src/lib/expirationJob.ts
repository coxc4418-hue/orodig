import { db, membersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";
import { computeReferralStatus } from "./membership";

export async function checkExpiredMemberships(): Promise<void> {
  try {
    const now = new Date();
    const allMembers = (await db.select().from(membersTable)) as any[];

    let updatedCount = 0;
    for (const member of allMembers) {
      if (member.referralStatus === "SUSPENDIDO") continue;

      const expiresAt = member.expiresAt ? new Date(member.expiresAt) : null;
      const nextStatus = computeReferralStatus(member.referralStatus, expiresAt);

      if (nextStatus !== (member.referralStatus || "ROJO")) {
        await db.update(membersTable)
          .set({ referralStatus: nextStatus })
          .where(eq(membersTable.id, member.id));

        logger.info(
          `[Membership Expirator] ${member.username} (ID: ${member.id}): ${member.referralStatus} → ${nextStatus}`,
        );
        updatedCount++;
      }
    }
    
    if (updatedCount > 0) {
      logger.info(`[Membership Expirator] Check completed. Updated ${updatedCount} members.`);
    }
  } catch (err: any) {
    logger.error(err, "[Membership Expirator] Error checking expired memberships");
  }
}

export function startExpirationWorker() {
  logger.info("[Membership Expirator] Expiration background worker initialized.");
  
  // Run once immediately on startup
  checkExpiredMemberships();
  
  // Run every 10 minutes (600,000 milliseconds)
  setInterval(() => {
    logger.info("[Membership Expirator] Running periodic background expiration check...");
    checkExpiredMemberships();
  }, 10 * 60 * 1000);
}
