import { Resend } from "resend";

export type Correo = {
    para: string;
    asunto: string;
    html: string;
    texto: string;
};

const REMITENTE = process.env.EMAIL_REMITENTE ?? "Sagunto Padel Cup <onboarding@resend.dev>";
const RESPUESTA = process.env.EMAIL_RESPUESTA ?? "saguntopadelcup@gmail.com";

let cliente: Resend | null = null;

function obtenerCliente(): Resend | null {
    const clave = process.env.RESEND_API_KEY;
    if (!clave) return null;
    cliente ??= new Resend(clave);
    return cliente;
}

// Envía un correo. Nunca lanza: un fallo de email no debe romper la acción que lo origina.
// Devuelve true si Resend lo aceptó.
export async function enviarCorreo(correo: Correo): Promise<boolean> {
    const resend = obtenerCliente();
    if (!resend) {
        console.warn(`[email] RESEND_API_KEY no definida. No se envía: ${correo.asunto}`);
        return false;
    }

    try {
        const { error } = await resend.emails.send({
            from: REMITENTE,
            to: correo.para,
            replyTo: RESPUESTA,
            subject: correo.asunto,
            html: correo.html,
            text: correo.texto,
        });
        if (error) {
            console.error(`[email] Resend rechazó "${correo.asunto}": ${error.message}`);
            return false;
        }
        return true;
    } catch (e) {
        console.error(`[email] Error enviando "${correo.asunto}":`, e);
        return false;
    }
}