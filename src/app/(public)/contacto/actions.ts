// Ruta: src/app/(public)/contacto/actions.ts
"use server";

import { Resend } from "resend";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);

const contactoSchema = z.object({
  nombre: z.string().min(2),
  email: z.string().email(),
  mensaje: z.string().min(5),
});

export async function enviarContacto(formData: unknown) {
  const parsed = contactoSchema.safeParse(formData);
  if (!parsed.success) return { ok: false, error: "Revisa los datos del formulario" };

  const { nombre, email, mensaje } = parsed.data;

  await resend.emails.send({
    from: "Sagunto Padel Cup <torneos@saguntopadelcup.com>",
    to: "hugocaparrosbasterra@gmail.com",
    replyTo: email,
    subject: `Contacto web: ${nombre}`,
    html: `<p><strong>${nombre}</strong> (${email}) escribe:</p><p>${mensaje}</p>`,
  });

  return { ok: true };
}