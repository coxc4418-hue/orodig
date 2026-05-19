import { db, membersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

/**
 * Escanea la base de datos y reasigna los referidos directos de patrocinadores
 * que llevan inactivos más de 60 días (basado en lastPaymentAt).
 * Estos referidos directos pasan a estar bajo el patrocinador del patrocinador inactivo (Bypass).
 */
export async function checkAndBypassInactiveSponsors(): Promise<void> {
  try {
    const allMembers = (await db.select().from(membersTable)) as any[];
    const memberMap = new Map(allMembers.map((m: any) => [m.id, m]));

    for (const member of allMembers) {
      if (member.sponsorId) {
        const sponsor = memberMap.get(member.sponsorId);
        if (sponsor) {
          // Evaluar inactividad del patrocinador (más de 60 días sin pago)
          const lastPayment = sponsor.lastPaymentAt;
          const daysSince = lastPayment 
            ? Math.floor((new Date().getTime() - new Date(lastPayment).getTime()) / (1000 * 60 * 60 * 24)) 
            : 999; // Si nunca ha pagado, asumimos inactividad absoluta

          if (daysSince > 60 || !sponsor.isActive) {
            const newSponsorId = sponsor.sponsorId; // Patrocinador de nivel superior

            // Actualizamos el patrocinador directo del miembro
            await db.update(membersTable)
              .set({ sponsorId: newSponsorId })
              .where(eq(membersTable.id, member.id));

            logger.info(
              `Bypass activado: El patrocinador ${sponsor.username} está inactivo. El miembro ${member.username} ha sido asignado al patrocinador superior (${newSponsorId ?? "Ninguno"}).`
            );
          }
        }
      }
    }
  } catch (error) {
    logger.error(error, "Error en checkAndBypassInactiveSponsors");
  }
}
