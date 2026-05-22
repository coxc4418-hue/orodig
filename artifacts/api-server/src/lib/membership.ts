/** Calcula y normaliza referralStatus según expiresAt (misma lógica que el frontend). */
export function computeReferralStatus(
  stored: string | null | undefined,
  expiresAt: Date | null | undefined,
): string {
  if (stored === "SUSPENDIDO") return "SUSPENDIDO";
  if (!expiresAt) return stored === "VERDE" || stored === "AMARILLO" ? "ROJO" : (stored || "ROJO");

  const expMs = expiresAt.getTime();
  if (expMs <= Date.now()) return "VENCIDO";

  const daysLeft = (expMs - Date.now()) / 86400000;
  if (daysLeft <= 5) return "AMARILLO";
  return "VERDE";
}
