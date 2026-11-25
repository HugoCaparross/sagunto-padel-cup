"use client";

import Boton from "@/components/ui/Boton";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { actualizarContacto, type ContactoFila } from "@/actions/contacto";
import { fechaCorta } from "@/lib/formato";
import {
    ESTADOS_CONTACTO,
    ETIQUETAS_ESTADO_CONTACTO,
    ETIQUETAS_TIPO_CONTACTO,
    type EstadoContacto,
} from "@/lib/validadores/contacto";

type Props = { filas: ContactoFila[] };

const COLOR_ESTADO: Record<EstadoContacto, string> = {
    nueva: "bg-[var(--color-info-bg)] text-[var(--color-info)]",
    en_curso: "bg-[var(--color-warning-bg)] text-[var(--color-warning)]",
    respondida: "bg-[var(--color-success-bg)] text-[var(--color-success)]",
    archivada: "bg-[var(--color-surface)] text-[var(--color-muted)]",
};

const ETIQUETA_TIPO = ETIQUETAS_TIPO_CONTACTO;

export default function BandejaContactos({ filas }: Props) {
    const [seleccionadoId, setSeleccionadoId] = useState<string | null>(filas[0]?.id ?? null);

    if (filas.length === 0) {
        return <p className="text-sm text-[var(--color-muted)]">No hay mensajes con este filtro.</p>;
    }

    const actual = filas.find((f) => f.id === seleccionadoId) ?? filas[0];

    return (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            <ul className="divide-y divide-[var(--color-border)] overflow-hidden rounded-xl bg-white ring-1 ring-[var(--color-border)]">
                {filas.map((f) => (
                    <li key={f.id}>
                        <button
                            type="button"
                            onClick={() => setSeleccionadoId(f.id)}
                            className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-[var(--color-surface)] ${f.id === actual.id ? "bg-[var(--color-surface)]" : ""
                                }`}
                        >
                            <span className="min-w-0 space-y-0.5">
                                <span className="block font-medium">{f.nombre}</span>
                                <span className="block truncate text-[var(--color-muted)]">{f.mensaje}</span>
                                <span className="block text-xs text-[var(--color-muted)]">
                                    {ETIQUETA_TIPO[f.tipo]} · {fechaCorta(f.createdAt)}
                                    {f.identificado ? " · cuenta" : " · anónimo"}
                                </span>
                            </span>
                            <span
                                className={`shrink-0 rounded px-2 py-0.5 text-xs ${COLOR_ESTADO[f.estado]}`}
                            >
                                {ETIQUETAS_ESTADO_CONTACTO[f.estado]}
                            </span>
                        </button>
                    </li>
                ))}
            </ul>

            <DetalleContacto key={actual.id} fila={actual} />
        </div>
    );
}

function DetalleContacto({ fila }: { fila: ContactoFila }) {
    const router = useRouter();
    const [pendiente, startTransition] = useTransition();
    const [estado, setEstado] = useState<EstadoContacto>(fila.estado);
    const [notas, setNotas] = useState(fila.notasInternas ?? "");
    const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

    function guardar() {
        setMensaje(null);
        startTransition(async () => {
            const res = await actualizarContacto({
                id: fila.id,
                estado,
                notasInternas: notas.trim() || null,
            });
            if (res.ok) {
                setMensaje({ tipo: "ok", texto: "Cambios guardados" });
                router.refresh();
            } else {
                setMensaje({ tipo: "error", texto: res.error });
            }
        });
    }

    return (
        <section className="space-y-4 rounded-xl bg-white p-5 ring-1 ring-[var(--color-border)]">
            <header className="space-y-1">
                <h2 className="text-lg font-semibold">{fila.nombre}</h2>
                <p className="text-sm text-[var(--color-muted)]">
                    {ETIQUETA_TIPO[fila.tipo]} · {fechaCorta(fila.createdAt)} ·{" "}
                    <a href={`mailto:${fila.email}`} className="underline">
                        {fila.email}
                    </a>
                </p>
            </header>

            <p className="whitespace-pre-line rounded-lg bg-[var(--color-surface)] p-4 text-sm leading-relaxed">
                {fila.mensaje}
            </p>

            <label className="flex flex-col gap-1 text-sm">
                <span className="text-[var(--color-muted)]">Estado</span>
                <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value as EstadoContacto)}
                    className="rounded-md border border-[var(--color-border)] bg-white px-2 py-1.5 text-sm"
                >
                    {ESTADOS_CONTACTO.map((e) => (
                        <option key={e} value={e}>
                            {ETIQUETAS_ESTADO_CONTACTO[e]}
                        </option>
                    ))}
                </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
                <span className="text-[var(--color-muted)]">Notas internas (solo visibles para el organizador)</span>
                <textarea
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    maxLength={2000}
                    rows={4}
                    className="rounded-md border border-[var(--color-border)] bg-white px-2 py-1.5 text-sm"
                />
            </label>

            <Boton variante="primario" tamano="md"
                type="button"
                onClick={guardar}
                disabled={pendiente}
                className="font-medium disabled:opacity-50"
            >
                {pendiente ? "Guardando…" : "Guardar"}
            </Boton>

            {mensaje && (
                <p
                    className={`rounded-lg p-3 text-sm ${mensaje.tipo === "ok"
                            ? "bg-[var(--color-success-bg)] text-[var(--color-success)]"
                            : "bg-[var(--color-danger-bg)] text-[var(--color-danger)]"
                        }`}
                >
                    {mensaje.texto}
                </p>
            )}
        </section>
    );
}
