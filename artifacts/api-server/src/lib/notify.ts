import { logger } from "./logger";

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

export async function sendNotificationEmail(payload: EmailPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "ORODIG PTS <noreply@oro-dig.firebaseapp.com>";

  if (!apiKey) {
    logger.info({ to: payload.to, subject: payload.subject }, "[email] RESEND_API_KEY no configurada — omitiendo envío");
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      logger.error({ err, to: payload.to }, "[email] Error al enviar");
    }
  } catch (err) {
    logger.error({ err }, "[email] Fallo de red al enviar");
  }
}

export function depositApprovedEmail(amount: number, balance: number) {
  return {
    subject: "Depósito aprobado — ORODIG PTS",
    html: `<p>Tu depósito de <strong>$${amount.toFixed(2)}</strong> fue aprobado.</p><p>Saldo actual: <strong>$${balance.toFixed(2)}</strong></p>`,
  };
}

export function purchaseApprovedEmail(productName: string, points: number) {
  return {
    subject: "Compra aprobada — ORODIG PTS",
    html: `<p>Tu compra de <strong>${productName}</strong> fue aprobada.</p><p>Puntos acreditados: <strong>${points}</strong>. Tu membresía VERDE fue extendida 30 días.</p>`,
  };
}

export function withdrawalApprovedEmail(amount: number) {
  return {
    subject: "Retiro aprobado — ORODIG PTS",
    html: `<p>Tu solicitud de retiro por <strong>$${amount.toFixed(2)}</strong> fue aprobada y está en proceso de pago.</p>`,
  };
}
