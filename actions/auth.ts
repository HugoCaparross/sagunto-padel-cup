"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { registrarConsentimiento } from "@/actions/legal";
import { usuarioActual } from "@/lib/auth/organizador";
import { rutaSegura } from "@/lib/auth/rutas";
import { crearClienteServidor } from "@/lib/supabase/server";
import {
    esquemaLogin,
    esquemaNuevaContrasena,
    esquemaOnboarding,
    esquemaRecuperar,
    esquemaRegistro,
} from "@/lib/validadores/auth";

export type AccionAuth = { ok: true; destino: string } | { ok: false; error: string };

const SITE = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const ERROR_GENERICO = "No se pudo completar la operación. Inténtalo de nuevo.";

function primerError(e: z.ZodError): string {
    return e.issues[0].message;
}

// ---------------------------------------------------------
// Entrar
// ---------------------------------------------------------
export async function iniciarSesion(entrada: unknown): Promise<AccionAuth> {
    const parseo = esquemaLogin.safeParse(entrada);
    if (!parseo.success) return { ok: false, error: primerError(parseo.error) };

    const supabase = await crearClienteServidor();
    const { data, error } = await supabase.auth.signInWithPassword({
        email: parseo.data.email,
        password: parseo.data.password,
    });
    if (error || !data.user) return { ok: false, error: "Email o contraseña incorrectos" };

    const { data: perfil } = await supabase
        .from("perfiles")
        .select("onboarding_completado_at")
        .eq("id", data.user.id)
        .maybeSingle<{ onboarding_completado_at: string | null }>();

    if (!perfil?.onboarding_completado_at) return { ok: true, destino: "/onboarding" };
    return { ok: true, destino: rutaSegura(parseo.data.siguiente) };
}

// ---------------------------------------------------------
// Registro: crea la cuenta y envía el email de confirmación
// ---------------------------------------------------------
export async function registrarse(entrada: unknown): Promise<AccionAuth> {
    const parseo = esquemaRegistro.safeParse(entrada);
    if (!parseo.success) return { ok: false, error: primerError(parseo.error) };
    const d = parseo.data;

    const supabase = await crearClienteServidor();
    const { data, error } = await supabase.auth.signUp({
        email: d.email,
        password: d.password,
        options: {
            data: { nombre: d.nombre },
            emailRedirectTo: `${SITE()}/auth/confirmar?next=/onboarding`,
        },
    });

    if (error) {
        return {
            ok: false,
            error:
                "No se pudo crear la cuenta. Si ya tienes una, inicia sesión o recupera tu contraseña.",
        };
    }

    // Si la confirmación de email está desactivada, ya hay sesión
    if (data.session) return { ok: true, destino: "/onboarding" };
    return { ok: true, destino: "/verificar" };
}

// ---------------------------------------------------------
// Recuperar contraseña: la respuesta es siempre la misma
// ---------------------------------------------------------
export async function recuperarContrasena(entrada: unknown): Promise<AccionAuth> {
    const parseo = esquemaRecuperar.safeParse(entrada);
    if (!parseo.success) return { ok: false, error: primerError(parseo.error) };

    const supabase = await crearClienteServidor();
    await supabase.auth.resetPasswordForEmail(parseo.data.email, {
        redirectTo: `${SITE()}/auth/confirmar?next=/nueva-contrasena`,
    });

    return { ok: true, destino: "/verificar?tipo=recuperar" };
}

// ---------------------------------------------------------
// Establecer nueva contraseña (tras el enlace de recuperación)
// ---------------------------------------------------------
export async function establecerContrasena(entrada: unknown): Promise<AccionAuth> {
    const parseo = esquemaNuevaContrasena.safeParse(entrada);
    if (!parseo.success) return { ok: false, error: primerError(parseo.error) };

    const supabase = await crearClienteServidor();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "El enlace ha caducado. Pide uno nuevo." };

    const { error } = await supabase.auth.updateUser({ password: parseo.data.password });
    if (error) return { ok: false, error: ERROR_GENERICO };

    return { ok: true, destino: "/cuenta" };
}

// ---------------------------------------------------------
// Onboarding: consentimientos y datos del perfil
// Cada consentimiento queda registrado con fecha y documento vigente.
// ---------------------------------------------------------
export async function completarOnboarding(entrada: unknown): Promise<AccionAuth> {
    const parseo = esquemaOnboarding.safeParse(entrada);
    if (!parseo.success) return { ok: false, error: primerError(parseo.error) };
    const d = parseo.data;

    const usuarioId = await usuarioActual();
    if (!usuarioId) return { ok: false, error: "Tu sesión ha caducado. Vuelve a entrar." };

    const privacidad = await registrarConsentimiento({
        tipo: "privacidad",
        concedido: true,
    });
    if (!privacidad.ok) return { ok: false, error: privacidad.error };

    const mayoria = await registrarConsentimiento({
        tipo: "mayoria_o_tutor",
        concedido: true,
    });
    if (!mayoria.ok) return { ok: false, error: mayoria.error };

    const imagen = await registrarConsentimiento({
        tipo: "imagen",
        concedido: d.consentimientoImagen,
    });
    if (!imagen.ok) return { ok: false, error: imagen.error };

    const supabase = await crearClienteServidor();
    const { error } = await supabase
        .from("perfiles")
        .update({
            nombre: d.nombre,
            talla_camiseta: d.tallaCamiseta,
            consentimiento_imagen: d.consentimientoImagen,
            visibilidad_publica: d.visibilidadPublica,
            onboarding_completado_at: new Date().toISOString(),
        })
        .eq("id", usuarioId);
    if (error) return { ok: false, error: ERROR_GENERICO };

    revalidatePath("/cuenta");
    revalidatePath("/jugadores");
    return { ok: true, destino: "/cuenta" };
}

// ---------------------------------------------------------
// Salir (se usa desde un <form action>)
// ---------------------------------------------------------
export async function cerrarSesion(): Promise<void> {
    const supabase = await crearClienteServidor();
    await supabase.auth.signOut();
    redirect("/");
}