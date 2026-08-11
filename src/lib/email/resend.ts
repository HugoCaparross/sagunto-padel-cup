// Ruta: src/lib/email/resend.ts

import { Resend } from "resend";

const FROM =
  "Sagunto Padel Cup <torneos@saguntopadelcup.com>";

function getResend() {
  const apiKey =
    process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY no está configurada."
    );
  }

  return new Resend(apiKey);
}

function escapeHtml(
  value: string
): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll(
      "'",
      "&#039;"
    );
}

export async function sendRegistrationConfirmedEmail(
  params: {
    to: string;
    nombre: string;
    torneoNombre: string;
    estado:
      | "confirmada"
      | "lista_espera";
  }
) {
  const {
    to,
    nombre,
    torneoNombre,
    estado,
  } = params;

  const nombreSeguro =
    escapeHtml(nombre);

  const torneoSeguro =
    escapeHtml(torneoNombre);

  const asunto =
    estado === "confirmada"
      ? `Inscripción confirmada — ${torneoNombre}`
      : `Estás en lista de espera — ${torneoNombre}`;

  const cuerpo =
    estado === "confirmada"
      ? `Hola ${nombreSeguro},<br/><br/>Tu inscripción en <strong>${torneoSeguro}</strong> está confirmada. Nos vemos en la pista.`
      : `Hola ${nombreSeguro},<br/><br/>Tu categoría está completa por ahora, así que has entrado en la lista de espera de <strong>${torneoSeguro}</strong>. Si se libera una plaza, te avisamos automáticamente.`;

  return getResend().emails.send({
    from: FROM,
    to,
    subject: asunto,
    html: `
      <div style="font-family:sans-serif;font-size:15px;color:#0D1B2A;">
        ${cuerpo}
      </div>
    `,
  });
}

export async function sendWaitlistPromotedEmail(
  params: {
    to: string;
    nombre: string;
    torneoNombre: string;
  }
) {
  const {
    to,
    nombre,
    torneoNombre,
  } = params;

  const nombreSeguro =
    escapeHtml(nombre);

  const torneoSeguro =
    escapeHtml(torneoNombre);

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `¡Ya tienes plaza! — ${torneoNombre}`,
    html: `
      <div style="font-family:sans-serif;font-size:15px;color:#0D1B2A;">
        Hola ${nombreSeguro},<br/><br/>
        Se ha liberado una plaza y ya estás confirmado/a en
        <strong>${torneoSeguro}</strong>.
      </div>
    `,
  });
}

export async function sendPartnerInviteEmail(
  params: {
    to: string;
    invitadoPorNombre: string;
    torneoNombre: string;
    signupUrl: string;
  }
) {
  const {
    to,
    invitadoPorNombre,
    torneoNombre,
    signupUrl,
  } = params;

  const nombreSeguro =
    escapeHtml(
      invitadoPorNombre
    );

  const torneoSeguro =
    escapeHtml(torneoNombre);

  const emailSeguro =
    escapeHtml(to);

  const signupUrlSeguro =
    escapeHtml(signupUrl);

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `${invitadoPorNombre} te ha invitado a jugar — ${torneoNombre}`,
    html: `
      <div style="font-family:sans-serif;font-size:15px;color:#0D1B2A;">
        Hola,<br/><br/>

        <strong>${nombreSeguro}</strong> te ha invitado a formar pareja en
        <strong>${torneoSeguro}</strong>.<br/><br/>

        Crea tu cuenta con este mismo email
        (${emailSeguro}) para completar la pareja:<br/><br/>

        <a
          href="${signupUrlSeguro}"
          style="background:#F0443A;color:#E6E6E6;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;"
        >
          Crear mi cuenta
        </a>
      </div>
    `,
  });
}