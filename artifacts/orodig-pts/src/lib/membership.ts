/** Fuente única de verdad para estado de membresía (alineado con API y dashboard). */
export type MembershipDisplay = {
  status: string;
  label: string;
  color: string;
  bg: string;
  daysRemaining: number;
  expired: boolean;
};

export function getMembershipDisplay(
  referralStatus?: string | null,
  expiresAt?: string | null,
): MembershipDisplay {
  const status = referralStatus || "ROJO";

  if (status === "SUSPENDIDO") {
    return {
      status: "SUSPENDIDO",
      label: "Suspendido",
      color: "#6b7280",
      bg: "#6b728015",
      daysRemaining: 0,
      expired: true,
    };
  }

  if (!expiresAt || status === "ROJO") {
    return {
      status: status === "VENCIDO" ? "VENCIDO" : "ROJO",
      label: status === "VENCIDO" ? "Vencido" : "Inactivo — ROJO",
      color: "#ef4444",
      bg: "#ef444415",
      daysRemaining: 0,
      expired: true,
    };
  }

  const expMs = new Date(expiresAt).getTime();
  const now = Date.now();
  const daysRemaining = Math.max(0, Math.ceil((expMs - now) / 86400000));

  if (expMs <= now) {
    return {
      status: "VENCIDO",
      label: "Vencido",
      color: "#ef4444",
      bg: "#ef444415",
      daysRemaining: 0,
      expired: true,
    };
  }

  if (daysRemaining <= 5) {
    return {
      status: "AMARILLO",
      label: "Próximo a vencer — Amarillo",
      color: "#eab308",
      bg: "#eab30815",
      daysRemaining,
      expired: false,
    };
  }

  return {
    status: "VERDE",
    label: "Activo — Verde",
    color: "#22c55e",
    bg: "#22c55e15",
    daysRemaining,
    expired: false,
  };
}
