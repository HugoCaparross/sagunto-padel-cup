"use client";

import Boton from "@/components/ui/Boton";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
    crearVersion,
    publicarVersion,
    type VersionDocumento,
} from "@/actions/legal";
import { publicarDocumentosIniciales } from "@/actions/legal-inicial";
import { fechaCorta } from "@/lib/formato";
import {
    REQUISITOS,
    TIPOS_DOCUMENTO,
    type TipoDocumento,
} from "@/lib/legal/requisitos";

type Props = {
    versiones: Record<TipoDocumento, VersionDocumento[]>;
    faltan: TipoDocumento[];
};

type Mensaje = { tipo: "ok" | "error"; texto: string };

function nombreDe(tipo: TipoDocumento): string {
    return REQUISITOS.find((r) => r.tipo === tipo)?.nombre ?? tipo;
}

export default function PanelLegal({ versiones, faltan }: Props) {
    const router = useRouter();
    const [pendiente, startTransition] = useTransition();
    const [mensaje, setMensaje] = useState<Mensaje | null>(null);
    const [avisos, setAvisos] = useState<string[]>([]);

    function cargarIniciales() {
        startTransition(async () => {
            const r = await publicarDocumentosIniciales();
            if (r.ok) {
                setMensaje({
                    tipo: "ok",
                    texto:
                        r.publicados.length > 0
                            ? `Publicados: ${r.publicados.join(", ")}`
                            : "No faltaba ningún documento",
                });
                router.refresh();
            } else {
                setMensaje({ tipo: "error", texto: r.error });
            }
        });
    }

    function publicar(id: string) {
        startTransition(async () => {
            const r = await publicarVersion({ id });
            if (r.ok) {
                setMensaje({ tipo: "ok", texto: "Versión publicada" });
                router.refresh();
            } else {
                setMensaje({ tipo: "error", texto: r.error });
            }
        });
    }

    function crear(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const form = e.currentTarget;
        const f = new FormData(form);

        startTransition(async () => {
            const r = await crearVersion({
                tipo: f.get("tipo"),
                titulo: f.get("titulo"),
                contenido: f.get("contenido"),
            });
            if (r.ok) {
                setAvisos(r.avisos ?? []);
                setMensaje({
                    tipo: "ok",
                    texto: "Versión creada como borrador. Publícala desde su historial.",
                });
                form.reset();
                router.refresh();
            } else {
                setAvisos([]);
                setMensaje({ tipo: "error", texto: r.error });
            }
        });
    }

    const campo = "rounded-md border border-[var(--color-border)] bg-white px-2 py-1.5 text-sm";

    return (
        <div className="space-y-8">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold">Documentos legales</h1>
                    <p className="text-sm text-[var(--color-muted)]">
                        Publica y versiona los textos que se muestran en la web.
                    </p>
                </div>
                <Boton variante="primario" tamano="md"
                    type="button"
                    onClick={cargarIniciales}
                    disabled={pendiente || faltan.length === 0}
                    className="font-medium disabled:opacity-50"
                >
                    Publicar documentos iniciales
                </Boton>
            </header>

            {faltan.length > 0 ? (
                <div className="rounded-lg bg-[var(--color-warning-bg)] p-3 text-sm text-[var(--color-warning)]">
                    Falta publicar: {faltan.map(nombreDe).join(", ")}
                </div>
            ) : (
                <div className="rounded-lg bg-[var(--color-success-bg)] p-3 text-sm text-[var(--color-success)]">
                    Todos los documentos tienen una versión vigente.
                </div>
            )}

            {mensaje && (
                <div
                    className={`rounded-lg p-3 text-sm ${mensaje.tipo === "ok"
                            ? "bg-[var(--color-success-bg)] text-[var(--color-success)]"
                            : "bg-[var(--color-danger-bg)] text-[var(--color-danger)]"
                        }`}
                >
                    {mensaje.texto}
                </div>
            )}

            {avisos.length > 0 && (
                <div className="rounded-lg bg-[var(--color-warning-bg)] p-3 text-sm text-[var(--color-warning)]">
                    {avisos.map((a) => (
                        <p key={a}>{a}</p>
                    ))}
                </div>
            )}

            <section className="space-y-6">
                {TIPOS_DOCUMENTO.map((tipo) => {
                    const lista = versiones[tipo] ?? [];
                    return (
                        <div key={tipo} className="rounded-xl bg-white p-4 ring-1 ring-[var(--color-border)]">
                            <h2 className="mb-3 font-semibold">{nombreDe(tipo)}</h2>

                            {lista.length === 0 ? (
                                <p className="text-sm text-[var(--color-muted)]">Sin versiones todavía.</p>
                            ) : (
                                <ul className="divide-y divide-[var(--color-border)] text-sm">
                                    {lista.map((v) => (
                                        <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                                            <span>
                                                Versión {v.version} · {v.titulo}
                                                {v.publicadoAt && (
                                                    <span className="text-[var(--color-muted)]">
                                                        {" "}· publicada el {fechaCorta(v.publicadoAt)}
                                                    </span>
                                                )}
                                            </span>
                                            {v.vigente ? (
                                                <span className="rounded bg-[var(--color-success-bg)] px-2 py-0.5 text-xs text-[var(--color-success)]">
                                                    Vigente
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => publicar(v.id)}
                                                    disabled={pendiente}
                                                    className="rounded-md bg-white px-2 py-1 text-xs ring-1 ring-[var(--color-border)] disabled:opacity-50"
                                                >
                                                    Publicar esta versión
                                                </button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    );
                })}
            </section>

            <section className="rounded-xl bg-white p-4 ring-1 ring-[var(--color-border)]">
                <h2 className="mb-3 font-semibold">Nueva versión (borrador)</h2>
                <form onSubmit={crear} className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="flex flex-col gap-1 text-sm">
                            <span className="text-[var(--color-muted)]">Documento</span>
                            <select name="tipo" required className={campo}>
                                {TIPOS_DOCUMENTO.map((t) => (
                                    <option key={t} value={t}>
                                        {nombreDe(t)}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="flex flex-col gap-1 text-sm">
                            <span className="text-[var(--color-muted)]">Título</span>
                            <input name="titulo" required minLength={5} className={campo} />
                        </label>
                    </div>
                    <label className="flex flex-col gap-1 text-sm">
                        <span className="text-[var(--color-muted)]">
                            Contenido (usa ## para títulos, - para listas y | para tablas)
                        </span>
                        <textarea name="contenido" required minLength={200} rows={16} className={`${campo} font-mono`} />
                    </label>
                    <button
                        type="submit"
                        disabled={pendiente}
                        className="rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-[var(--color-border)] disabled:opacity-50"
                    >
                        Crear borrador
                    </button>
                </form>
            </section>
        </div>
    );
}