"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import {
    completarOnboarding,
    establecerContrasena,
    iniciarSesion,
    recuperarContrasena,
    registrarse,
    type AccionAuth,
} from "@/actions/auth";
import { TALLAS } from "@/lib/validadores/auth";

const CAMPO = "rounded-md border border-[#D5D9DC] bg-white px-3 py-2 text-sm";
const BOTON =
    "w-full rounded-lg bg-[#F0443A] px-4 py-2 text-sm font-medium text-white disabled:opacity-50";

function useEnvio() {
    const router = useRouter();
    const [pendiente, start] = useTransition();
    const [error, setError] = useState<string | null>(null);

    function enviar(accion: () => Promise<AccionAuth>) {
        start(async () => {
            setError(null);
            const res = await accion();
            if (res.ok) router.push(res.destino);
            else setError(res.error);
        });
    }

    return { pendiente, error, enviar };
}

function Error({ texto }: { texto: string | null }) {
    if (!texto) return null;
    return <p className="rounded-lg bg-[#FDECEC] p-3 text-sm text-[#C73535]">{texto}</p>;
}

function Campo({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
    return (
        <label className="flex flex-col gap-1 text-sm">
            <span className="text-[#68737D]">{etiqueta}</span>
            {children}
        </label>
    );
}

// ---------------------------------------------------------
export function LoginForm({ siguiente }: { siguiente?: string }) {
    const { pendiente, error, enviar } = useEnvio();

    function alEnviar(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        enviar(() =>
            iniciarSesion({
                email: String(f.get("email") ?? ""),
                password: String(f.get("password") ?? ""),
                siguiente,
            })
        );
    }

    return (
        <form onSubmit={alEnviar} className="space-y-4">
            <Campo etiqueta="Email">
                <input name="email" type="email" required className={CAMPO} />
            </Campo>
            <Campo etiqueta="Contraseña">
                <input name="password" type="password" required className={CAMPO} />
            </Campo>
            <Error texto={error} />
            <button type="submit" disabled={pendiente} className={BOTON}>
                {pendiente ? "Entrando…" : "Entrar"}
            </button>
            <div className="flex justify-between text-sm">
                <Link href="/recuperar" className="underline">
                    He olvidado la contraseña
                </Link>
                <Link href="/registro" className="underline">
                    Crear cuenta
                </Link>
            </div>
        </form>
    );
}

// ---------------------------------------------------------
export function RegistroForm() {
    const { pendiente, error, enviar } = useEnvio();

    function alEnviar(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        enviar(() =>
            registrarse({
                nombre: String(f.get("nombre") ?? ""),
                email: String(f.get("email") ?? ""),
                password: String(f.get("password") ?? ""),
                aceptaCondiciones: f.get("acepta") === "on",
            })
        );
    }

    return (
        <form onSubmit={alEnviar} className="space-y-4">
            <Campo etiqueta="Nombre">
                <input name="nombre" required minLength={2} maxLength={80} className={CAMPO} />
            </Campo>
            <Campo etiqueta="Email">
                <input name="email" type="email" required className={CAMPO} />
            </Campo>
            <Campo etiqueta="Contraseña (mínimo 10 caracteres)">
                <input name="password" type="password" required minLength={10} className={CAMPO} />
            </Campo>
            <label className="flex items-start gap-2 text-sm">
                <input name="acepta" type="checkbox" required className="mt-1" />
                <span>
                    Acepto la{" "}
                    <Link href="/privacidad" className="underline">
                        política de privacidad
                    </Link>{" "}
                    y el{" "}
                    <Link href="/reglamento" className="underline">
                        reglamento del circuito
                    </Link>
                    .
                </span>
            </label>
            <Error texto={error} />
            <button type="submit" disabled={pendiente} className={BOTON}>
                {pendiente ? "Creando cuenta…" : "Crear cuenta"}
            </button>
        </form>
    );
}

// ---------------------------------------------------------
export function RecuperarForm() {
    const { pendiente, error, enviar } = useEnvio();

    function alEnviar(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        enviar(() => recuperarContrasena({ email: String(f.get("email") ?? "") }));
    }

    return (
        <form onSubmit={alEnviar} className="space-y-4">
            <Campo etiqueta="Email de tu cuenta">
                <input name="email" type="email" required className={CAMPO} />
            </Campo>
            <Error texto={error} />
            <button type="submit" disabled={pendiente} className={BOTON}>
                Enviar enlace
            </button>
        </form>
    );
}

// ---------------------------------------------------------
export function NuevaContrasenaForm() {
    const { pendiente, error, enviar } = useEnvio();

    function alEnviar(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        enviar(() =>
            establecerContrasena({
                password: String(f.get("password") ?? ""),
                confirmacion: String(f.get("confirmacion") ?? ""),
            })
        );
    }

    return (
        <form onSubmit={alEnviar} className="space-y-4">
            <Campo etiqueta="Nueva contraseña (mínimo 10 caracteres)">
                <input name="password" type="password" required minLength={10} className={CAMPO} />
            </Campo>
            <Campo etiqueta="Repite la contraseña">
                <input name="confirmacion" type="password" required minLength={10} className={CAMPO} />
            </Campo>
            <Error texto={error} />
            <button type="submit" disabled={pendiente} className={BOTON}>
                Guardar contraseña
            </button>
        </form>
    );
}

// ---------------------------------------------------------
export function OnboardingForm({ nombreInicial }: { nombreInicial: string }) {
    const { pendiente, error, enviar } = useEnvio();

    function alEnviar(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const talla = String(f.get("talla") ?? "");
        enviar(() =>
            completarOnboarding({
                nombre: String(f.get("nombre") ?? ""),
                tallaCamiseta: talla ? (talla as (typeof TALLAS)[number]) : null,
                consentimientoPrivacidad: f.get("privacidad") === "on",
                mayoriaOTutor: f.get("mayoria") === "on",
                consentimientoImagen: f.get("imagen") === "on",
                visibilidadPublica: f.get("visibilidad") === "on",
            })
        );
    }

    return (
        <form onSubmit={alEnviar} className="space-y-6">
            <Campo etiqueta="Nombre que verán los demás jugadores">
                <input name="nombre" defaultValue={nombreInicial} required minLength={2} maxLength={80} className={CAMPO} />
            </Campo>

            <Campo etiqueta="Talla de camiseta (opcional)">
                <select name="talla" defaultValue="" className={CAMPO}>
                    <option value="">Sin indicar</option>
                    {TALLAS.map((t) => (
                        <option key={t} value={t}>
                            {t}
                        </option>
                    ))}
                </select>
            </Campo>

            <fieldset className="space-y-3">
                <legend className="mb-2 text-sm font-medium">Consentimientos</legend>

                <label className="flex items-start gap-2 text-sm">
                    <input name="privacidad" type="checkbox" required className="mt-1" />
                    <span>
                        Acepto la{" "}
                        <Link href="/privacidad" className="underline">
                            política de privacidad
                        </Link>
                        . (obligatorio)
                    </span>
                </label>

                <label className="flex items-start gap-2 text-sm">
                    <input name="mayoria" type="checkbox" required className="mt-1" />
                    <span>
                        Soy mayor de edad o tengo autorización de mi tutor legal. (obligatorio)
                    </span>
                </label>

                <label className="flex items-start gap-2 text-sm">
                    <input name="imagen" type="checkbox" className="mt-1" />
                    <span>
                        Autorizo el uso de mi imagen en fotos y vídeos de las pruebas publicados en la web y
                        redes del circuito. (opcional, puedes retirarlo cuando quieras)
                    </span>
                </label>

                <label className="flex items-start gap-2 text-sm">
                    <input name="visibilidad" type="checkbox" className="mt-1" />
                    <span>
                        Mostrar mi nombre y mis resultados en el ranking y en mi perfil público. Si no lo
                        marcas, aparecerás como "Jugador privado". (opcional)
                    </span>
                </label>
            </fieldset>

            <Error texto={error} />
            <button type="submit" disabled={pendiente} className={BOTON}>
                {pendiente ? "Guardando…" : "Continuar"}
            </button>
        </form>
    );
}