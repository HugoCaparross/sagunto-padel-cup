// Ruta: src/app/(public)/contacto/actions.ts

"use server";

import { Resend } from "resend";
import { z } from "zod";

const contactoSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "Introduce tu nombre.")
    .max(100, "El nombre es demasiado largo."),
  email: z
    .string()
    .trim()
    .email("Introduce un email válido.")
    .max(254, "El email es demasiado largo."),
  mensaje: z
    .string()
    .trim()
    .min(5, "Escribe un mensaje más completo.")
    .max(2_000, "El mensaje es demasiado largo."),
  empresa: z.string().trim().max(0, "Valor no válido.").optional(),
});

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => {
    const replacements: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };

    return replacements[character] ?? character;
  });
}

export async function enviarContacto(formData: unknown) {
  const parsed = contactoSchema.safeParse(formData);

  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ?? "Revisa los datos del formulario.",
    };
  }

  if (parsed.data.empresa) {
    return { ok: true };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const contactEmail = process.env.CONTACT_EMAIL;

  if (!apiKey || !contactEmail) {
    console.error("[contacto] Faltan RESEND_API_KEY o CONTACT_EMAIL.");

    return {
      ok: false,
      error: "El servicio de contacto no está disponible en este momento.",
    };
  }

  const resend = new Resend(apiKey);

  try {
    const { nombre, email, mensaje } = parsed.data;

    const { error } = await resend.emails.send({
      from: "Sagunto Padel Cup <torneos@saguntopadelcup.com>",
      to: contactEmail,
      replyTo: email,
      subject: `Contacto web: ${nombre}`,
      html: `
        <div style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#0D1B2A;">
          <p><strong>Nombre:</strong> ${escapeHtml(nombre)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Mensaje:</strong></p>
          <p>${escapeHtml(mensaje).replace(/\n/g, "<br>")}</p>
        </div>
      `,
    });

    if (error) {
      console.error("[contacto] Resend devolvió un error:", error);

      return {
        ok: false,
        error:
          "No se ha podido enviar el mensaje. Inténtalo de nuevo más tarde.",
      };
    }

    return { ok: true };
  } catch (error) {
    console.error("[contacto] Error enviando mensaje:", error);

    return {
      ok: false,
      error: "No se ha podido enviar el mensaje. Inténtalo de nuevo más tarde.",
    };
  }
}
