"use client";

import Link from "next/link";
import { useState, useTransition, type FormEvent } from "react";
import { enviarContacto } from "@/actions/contacto";
import type { TipoContacto } from "@/lib/validadores/contacto";
import Aviso from "@/components/ui/Aviso";
import Boton from "@/components/ui/Boton";

type Props = { logueado: boolean; tipoInicial?: TipoContacto };

export default function FormularioContacto({ logueado, tipoInicial = "consulta" }: Props) {
    const [pendiente, startTransition] = useTransition();
    const [enviado, setEnviado] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function enviar(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const form = e.currentTarget;
        const f = new FormData(form);
        setError(null);
        setEnviado(false);

        startTransition(async () => {
            const res = await enviarContacto({
                tipo: f.get("tipo"),
                nombre: f.get("nombre"),
                email: f.get("email"),
                mensaje: f.get("mensaje"),
                consentimiento: f.get("consentimiento") === "on",
                web: f.get("web") ?? "",
            });

            if (res.ok) {
                setEnviado(true);
                form.reset();
            } else {
                setError(res.error);
            }
        });
    }

    const campo = "rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm";

    return (
        <form onSubmit={enviar} className="space-y-5 rounded-xl bg-white p-6 ring-1 ring-[var(--color-border)]">
            <fieldset className="space-y-2">
                <legend className="text-sm text-[var(--color-muted)]">Tipo de mensaje</legend>
                <label className="flex items-center gap-2 text-sm">
                    <input type="radio" name="tipo" value="consulta" defaultChecked={tipoInicial === "consulta"} />
                    Consulta
                </label>
                <label
                    className={`flex items-center gap-2 text-sm ${logueado ? "" : "opacity-50"}`}
                >
                    <input type="radio" name="tipo" value="sugerencia" defaultChecked={tipoInicial === "sugerencia"} disabled={!logueado} />
                    Sugerencia {logueado ? "" : "(requiere iniciar sesión)"}
                </label>
                <label className="flex items-center gap-2 text-sm">
                    <input type="radio" name="tipo" value="patrocinio" defaultChecked={tipoInicial === "patrocinio"} />
                    Patrocinio
                </label>
            </fieldset>

            <label className="flex flex-col gap-1 text-sm">
                <span className="text-[var(--color-muted)]">Nombre</span>
                <input name="nombre" autoComplete="name" required minLength={2} maxLength={80} className={campo} />
            </label>

            <label className="flex flex-col gap-1 text-sm">
                <span className="text-[var(--color-muted)]">Email</span>
                <input name="email" type="email" autoComplete="email" required maxLength={254} className={campo} />
            </label>

            <label className="flex flex-col gap-1 text-sm">
                <span className="text-[var(--color-muted)]">Mensaje</span>
                <textarea name="mensaje" required minLength={10} maxLength={2000} rows={6} className={campo} />
            </label>

            {/* Campo trampa: oculto para las personas, los bots lo rellenan */}
            <input
                name="web"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute -left-[9999px] h-0 w-0 opacity-0"
            />

            <label className="flex items-start gap-2 text-sm">
                <input name="consentimiento" type="checkbox" required className="mt-1" />
                <span>
                    He leído y acepto la{" "}
                    <Link href="/privacidad" className="underline">
                        política de privacidad
                    </Link>{" "}
                    y el{" "}
                    <Link href="/aviso-legal" className="underline">
                        aviso legal
                    </Link>
                    . Mis datos se usarán solo para responder a este mensaje.
                </span>
            </label>

            {error && <Aviso tipo="error">{error}</Aviso>}

            {enviado && (
                <Aviso tipo="exito">
                    Mensaje enviado. Te responderemos por email.
                </Aviso>
            )}

            <Boton
                type="submit"
                disabled={pendiente}
            >
                {pendiente ? "Enviando…" : "Enviar"}
            </Boton>
        </form>
    );
}
