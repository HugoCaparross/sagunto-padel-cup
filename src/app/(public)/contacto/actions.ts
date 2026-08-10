// Ruta: src/app/(public)/contacto/actions.ts
"use server";

import { Resend } from "resend";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);
const contactEmail = process.env.CONTACT_EMAIL ?? "hugocaparrosbasterra@gmail.com";

const contactoSchema = z.object({
  nombre: z.string().trim().min(2).max(100),
  email: z.string().email(),
  mensaje: z.string().trim().min(5).max(2_000),
  empresa: z.string().max(0).optional(),
});

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] as string);
}

export async function enviarContacto(formData: unknown) {
  const parsed = contactoSchema.safeParse(formData);
  if (!parsed.success) return { ok: false, error: "Revisa los datos del formulario" };

  const { nombre, email, mensaje, empresa } = parsed.data;
  if (empresa) return { ok: true };

  const { error } = await resend.emails.send({
    from: "Sagunto Padel Cup <torneos@saguntopadelcup.com>",
    to: contactEmail,
    replyTo: email,
    subject: `Contacto web: ${nombre}`,
    html: `<p><strong>${escapeHtml(nombre)}</strong> (${escapeHtml(email)}) escribe:</p><p>${escapeHtml(mensaje).replace(/\n/g, "<br>")}</p>`,
  });

  if (error) return { ok: false, error: "No se ha podido enviar el mensaje" };
  return { ok: true };
}
