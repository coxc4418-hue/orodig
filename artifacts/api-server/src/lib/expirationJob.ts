import { db, membersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

export async function checkExpiredMemberships(): Promise<void> {
  try {
    const now = new Date();
    // Query all members to check their status
    const allMembers = (await db.select().from(membersTable)) as any[];
    
    let expiredCount = 0;
    for (const member of allMembers) {
      if (member.referralStatus === "VERDE" && member.expiresAt) {
        const expTime = new Date(member.expiresAt).getTime();
        if (now.getTime() > expTime) {
          // Transition to VENCIDO
          await db.update(membersTable)
            .set({ referralStatus: "VENCIDO" })
            .where(eq(membersTable.id, member.id));
            
          logger.info(`[Membership Expirator] Member ${member.username} (ID: ${member.id}) has expired. Status updated to VENCIDO.`);
          expiredCount++;
        }
      }
    }
    
    if (expiredCount > 0) {
      logger.info(`[Membership Expirator] Expiration check completed. Flagged ${expiredCount} expired members.`);
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
