"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { actualizarContacto, type ContactoFila } from "@/actions/contacto";
import { fechaCorta } from "@/lib/formato";
import {
    ESTADOS_CONTACTO,
    ETIQUETAS_ESTADO_CONTACTO,
    type EstadoContacto,
} from "@/lib/validadores/contacto";

type Props = { filas: ContactoFila[] };

const COLOR_ESTADO: Record<EstadoContacto, string> = {
    nueva: "bg-[#E8F0FB] text-[#2767B1]",
    en_curso: "bg-[#FFF4DE] text-[#B77912]",
    respondida: "bg-[#EAF6EF] text-[#16845B]",
    archivada: "bg-[#F4F5F4] text-[#68737D]",
};

const ETIQUETA_TIPO = { consulta: "Consulta", sugerencia: "Sugerencia" } as const;

export default function BandejaContactos({ filas }: Props) {
    const [seleccionadoId, setSeleccionadoId] = useState<string | null>(filas[0]?.id ?? null);

    if (filas.length === 0) {
        return <p className="text-sm text-[#68737D]">No hay mensajes con este filtro.</p>;
    }

    const actual = filas.find((f) => f.id === seleccionadoId) ?? filas[0];

    return (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            <ul className="divide-y divide-[#D5D9DC] overflow-hidden rounded-xl bg-white ring-1 ring-[#D5D9DC]">
                {filas.map((f) => (
                    <li key={f.id}>
                        <button
                            type="button"
                            onClick={() => setSeleccionadoId(f.id)}
                            className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-[#F4F5F4] ${f.id === actual.id ? "bg-[#F4F5F4]" : ""
                                }`}
                        >
                            <span className="min-w-0 space-y-0.5">
                                <span className="block font-medium">{f.nombre}</span>
                                <span className="block truncate text-[#68737D]">{f.mensaje}</span>
                                <span className="block text-xs text-[#68737D]">
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
        <section className="space-y-4 rounded-xl bg-white p-5 ring-1 ring-[#D5D9DC]">
            <header className="space-y-1">
                <h2 className="text-lg font-semibold">{fila.nombre}</h2>
                <p className="text-sm text-[#68737D]">
                    {ETIQUETA_TIPO[fila.tipo]} · {fechaCorta(fila.createdAt)} ·{" "}
                    <a href={`mailto:${fila.email}`} className="underline">
                        {fila.email}
                    </a>
                </p>
            </header>

            <p className="whitespace-pre-line rounded-lg bg-[#F4F5F4] p-4 text-sm leading-relaxed">
                {fila.mensaje}
            </p>

            <label className="flex flex-col gap-1 text-sm">
                <span className="text-[#68737D]">Estado</span>
                <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value as EstadoContacto)}
                    className="rounded-md border border-[#D5D9DC] bg-white px-2 py-1.5 text-sm"
                >
                    {ESTADOS_CONTACTO.map((e) => (
                        <option key={e} value={e}>
                            {ETIQUETAS_ESTADO_CONTACTO[e]}
                        </option>
                    ))}
                </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
                <span className="text-[#68737D]">Notas internas (solo visibles para el organizador)</span>
                <textarea
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    maxLength={2000}
                    rows={4}
                    className="rounded-md border border-[#D5D9DC] bg-white px-2 py-1.5 text-sm"
                />
            </label>

            <button
                type="button"
                onClick={guardar}
                disabled={pendiente}
                className="rounded-lg bg-[#F0443A] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
                {pendiente ? "Guardando…" : "Guardar"}
            </button>

            {mensaje && (
                <p
                    className={`rounded-lg p-3 text-sm ${mensaje.tipo === "ok"
                            ? "bg-[#EAF6EF] text-[#16845B]"
                            : "bg-[#FDECEC] text-[#C73535]"
                        }`}
                >
                    {mensaje.texto}
                </p>
            )}
        </section>
    );
}