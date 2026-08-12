// Ruta: src/lib/email/resend.ts

import { Resend } from "resend";

const FROM =
  "Sagunto Padel Cup <torneos@saguntopadelcup.com>";

function getResend(): Resend {
  const apiKey =
    process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY no está configurada.",
    );
  }

  return new Resend(
    apiKey,
  );
}

function escapeHtml(
  value: string,
): string {
  return value
    .replaceAll(
      "&",
      "&amp;",
    )
    .replaceAll(
      "<",
      "&lt;",
    )
    .replaceAll(
      ">",
      "&gt;",
    )
    .replaceAll(
      '"',
      "&quot;",
    )
    .replaceAll(
      "'",
      "&#039;",
    );
}

function normalizarEmail(
  value: string,
): string {
  return value
    .trim()
    .toLowerCase();
}

function validarEmail(
  value: string,
): void {
  const email =
    normalizarEmail(value);

  if (
    !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email,
    )
  ) {
    throw new Error(
      "Dirección de email no válida.",
    );
  }
}

export async function sendRegistrationConfirmedEmail(
  params: {
    to: string;
    nombre: string;
    torneoNombre: string;
    estado:
      | "confirmada"
      | "lista_espera";
  },
) {
  const to =
    normalizarEmail(
      params.to,
    );

  validarEmail(to);

  const nombreSeguro =
    escapeHtml(
      params.nombre.trim(),
    );

  const torneoSeguro =
    escapeHtml(
      params.torneoNombre.trim(),
    );

  const asunto =
    params.estado ===
    "confirmada"
      ? `Inscripción confirmada — ${params.torneoNombre}`
      : `Estás en lista de espera — ${params.torneoNombre}`;

  const cuerpo =
    params.estado ===
    "confirmada"
      ? `Hola ${nombreSeguro},<br/><br/>Tu inscripción en <strong>${torneoSeguro}</strong> está confirmada. Nos vemos en la pista.`
      : `Hola ${nombreSeguro},<br/><br/>Tu categoría está completa por ahora, así que has entrado en la lista de espera de <strong>${torneoSeguro}</strong>. Si se libera una plaza, te avisamos automáticamente.`;

  return getResend().emails.send(
    {
      from: FROM,
      to,
      subject: asunto,
      html: `<div style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#0D1B2A;">${cuerpo}</div>`,
    },
  );
}

export async function sendWaitlistPromotedEmail(
  params: {
    to: string;
    nombre: string;
    torneoNombre: string;
  },
) {
  const to =
    normalizarEmail(
      params.to,
    );

  validarEmail(to);

  const nombreSeguro =
    escapeHtml(
      params.nombre.trim(),
    );

  const torneoSeguro =
    escapeHtml(
      params.torneoNombre.trim(),
    );

  return getResend().emails.send(
    {
      from: FROM,
      to,
      subject: `¡Ya tienes plaza! — ${params.torneoNombre}`,
      html: `
      <div style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#0D1B2A;">
        Hola ${nombreSeguro},<br/><br/>
        Se ha liberado una plaza y ya estás confirmado/a en
        <strong>${torneoSeguro}</strong>.
      </div>
    `,
    },
  );
}

export async function sendPartnerInviteEmail(
  params: {
    to: string;
    invitadoPorNombre: string;
    torneoNombre: string;
    signupUrl: string;
  },
) {
  const to =
    normalizarEmail(
      params.to,
    );

  validarEmail(to);

  let signupUrl: URL;

  try {
    signupUrl =
      new URL(
        params.signupUrl,
      );
  } catch {
    throw new Error(
      "URL de registro no válida.",
    );
  }

  if (
    signupUrl.protocol !==
      "https:" &&
    signupUrl.hostname !==
      "localhost"
  ) {
    throw new Error(
      "La URL de registro debe utilizar HTTPS.",
    );
  }

  const nombreSeguro =
    escapeHtml(
      params.invitadoPorNombre.trim(),
    );

  const torneoSeguro =
    escapeHtml(
      params.torneoNombre.trim(),
    );

  const signupUrlSeguro =
    escapeHtml(
      signupUrl.toString(),
    );

  return getResend().emails.send(
    {
      from: FROM,
      to,
      subject: `${params.invitadoPorNombre} te ha invitado a jugar — ${params.torneoNombre}`,
      html: `
      <div style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#0D1B2A;">
        Hola,<br/><br/>
        <strong>${nombreSeguro}</strong> te ha invitado a formar pareja en
        <strong>${torneoSeguro}</strong>.<br/><br/>
        Crea tu cuenta con este mismo email para completar la pareja:<br/><br/>
        <a href="${signupUrlSeguro}" style="background:#F0443A;color:#E6E6E6;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;">
          Crear mi cuenta
        </a>
      </div>
    `,
    },
  );
}