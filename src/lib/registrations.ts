// src/lib/registrations.ts

/**
 * Mensajes y constantes de dominio utilizados por la interfaz de
 * inscripción de Sagunto Padel Cup.
 *
 * IMPORTANTE:
 * Sagunto Padel Cup no realiza pagos online.
 *
 * El jugador completa la inscripción desde la web y el pago se realiza
 * presencialmente. La organización verifica manualmente el pago.
 */

export const PAYMENT_NOTICE =
    "Inscripción realizada correctamente. El pago de la inscripción se realizará de forma presencial. La organización verificará manualmente el pago.";

export const PAYMENT_STATUS_LABELS = {
    pendiente: "PENDIENTE",
    verificado: "PAGADO",
    rechazado: "RECHAZADO",
    no_aplicable: "NO APLICA",
} as const;

export type PaymentStatus =
    keyof typeof PAYMENT_STATUS_LABELS;

export function getPaymentStatusLabel(
    status: PaymentStatus,
): string {
    return (
        PAYMENT_STATUS_LABELS[status] ??
        "PENDIENTE"
    );
}

export function isPaymentVerified(
    status: PaymentStatus,
): boolean {
    return (
        status === "verificado"
    );
}