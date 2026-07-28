// Ruta: src/lib/email/resend.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "Sagunto Padel Cup <torneos@saguntopadelcup.com>";

export async function sendRegistrationConfirmedEmail(params: {
  to: string;
  nombre: string;
  torneoNombre: string;
  estado: "confirmada" | "lista_espera";
}) {
  const { to, nombre, torneoNombre, estado } = params;

  const asunto =
    estado === "confirmada"
      ? `Inscripción confirmada — ${torneoNombre}`
      : `Estás en lista de espera — ${torneoNombre}`;

  const cuerpo =
    estado === "confirmada"
      ? `Hola ${nombre},<br/><br/>Tu inscripción en <strong>${torneoNombre}</strong> está confirmada. Nos vemos en la pista.`
      : `Hola ${nombre},<br/><br/>Tu categoría está completa por ahora, así que has entrado en la lista de espera de <strong>${torneoNombre}</strong>. Si se libera una plaza, te avisamos automáticamente.`;

  return resend.emails.send({
    from: FROM,
    to,
    subject: asunto,
    html: `<div style="font-family: sans-serif; font-size: 15px; color: #0D1B2A;">${cuerpo}</div>`,
  });
}

export async function sendWaitlistPromotedEmail(params: {
  to: string;
  nombre: string;
  torneoNombre: string;
}) {
  const { to, nombre, torneoNombre } = params;

  return resend.emails.send({
    from: FROM,
    to,
    subject: `¡Ya tienes plaza! — ${torneoNombre}`,
    html: `<div style="font-family: sans-serif; font-size: 15px; color: #0D1B2A;">Hola ${nombre},<br/><br/>Se ha liberado una plaza y ya estás confirmado/a en <strong>${torneoNombre}</strong>.</div>`,
  });
}