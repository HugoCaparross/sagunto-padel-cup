"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { darDeBajaConAviso } from "@/actions/notificaciones";
import { confirmarInscripcion, marcarPagadaEnPrueba } from "@/actions/inscritos";
import {
    ETIQUETAS_CATEGORIA,
    ETIQUETAS_ESTADO_INSCRIPCION,
    type Categoria,
    type EstadoInscripcion,
} from "@/lib/constantes";
import { fechaCorta } from "@/lib/formato";

export type FilaPanel = {
    id: string;
    categoria: Categoria;
    estado: EstadoInscripcion;
    texto: string;
    llegada: string | null;
    alta: string;
};

type Resultado = { ok: boolean; error?: string };

const COLOR: Record<EstadoInscripcion, string> = {
    pendiente: "badge-aviso",
    confirmada: "badge-exito",
    pagada_en_prueba: "badge-info",
    lista_espera: "badge-neutro",
    retirada: "badge-neutro",
};

export default function PanelInscripciones({ filas }: { filas: FilaPanel[] }) {
    const router = useRouter();
    const [pendiente, startTransition] = useTransition();
    const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
    const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

    function alternar(id: string) {
        setSeleccion((prev) => {
            const siguiente = new Set(prev);
            if (siguiente.has(id)) siguiente.delete(id);
            else siguiente.add(id);
            return siguiente;
        });
    }

    function ejecutar(fn: () => Promise<Resultado>, okTexto: string) {
        setMensaje(null);
        startTransition(async () => {
            const r = await fn();
            if (r.ok) {
                setMensaje({ tipo: "ok", texto: okTexto });
                router.refresh();
            } else {
                setMensaje({ tipo: "error", texto: r.error ?? "Error inesperado" });
            }
        });
    }

    function baja(f: FilaPanel) {
        const motivo = window.prompt(
            `Motivo para dar de baja a ${f.texto} (mínimo 10 caracteres). Queda registrado en auditoría y se avisa por email:`
        );
        if (!motivo) return;
        ejecutar(
            () => darDeBajaConAviso({ inscripcionId: f.id, motivo }),
            "Inscripción dada de baja y avisos enviados"
        );
    }

    function confirmarSeleccion() {
        const ids = filas
            .filter((f) => seleccion.has(f.id) && f.estado === "pendiente")
            .map((f) => f.id);

        if (ids.length === 0) {
            setMensaje({ tipo: "error", texto: "Selecciona inscripciones pendientes" });
            return;
        }

        setMensaje(null);
        startTransition(async () => {
            let confirmadas = 0;
            let error: string | null = null;

            for (const id of ids) {
                const r = await confirmarInscripcion({ inscripcionId: id });
                if (r.ok) confirmadas++;
                else {
                    error = r.error ?? "Error inesperado";
                    break;
                }
            }

            setMensaje(
                error
                    ? { tipo: "error", texto: `Confirmadas ${confirmadas} de ${ids.length}: ${error}` }
                    : { tipo: "ok", texto: `Confirmadas ${confirmadas} y avisadas por email` }
            );
            setSeleccion(new Set());
            router.refresh();
        });
    }

    if (filas.length === 0) {
        return <p className="text-sm text-muted">No hay inscripciones con estos filtros.</p>;
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted">{seleccion.size} seleccionadas</p>
                <button
                    type="button"
                    onClick={confirmarSeleccion}
                    disabled={pendiente || seleccion.size === 0}
                    className="btn btn-primario"
                >
                    Confirmar seleccionadas
                </button>
            </div>

            {mensaje && (
                <p className={`alerta ${mensaje.tipo === "ok" ? "alerta-exito" : "alerta-error"}`}>
                    {mensaje.texto}
                </p>
            )}

            <div className="card overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-surface text-left text-sm uppercase text-muted">
                        <tr>
                            <th className="w-10 px-4 py-2"><span className="sr-only">Seleccionar</span></th>
                            <th className="px-4 py-2">Pareja</th>
                            <th className="px-4 py-2">Categoría</th>
                            <th className="px-4 py-2">Estado</th>
                            <th className="px-4 py-2">Llegada</th>
                            <th className="px-4 py-2">Alta</th>
                            <th className="px-4 py-2 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filas.map((f) => (
                            <tr key={f.id} className="border-t border-border">
                                <td className="px-4 py-2">
                                    <input
                                        type="checkbox"
                                        checked={seleccion.has(f.id)}
                                        onChange={() => alternar(f.id)}
                                        aria-label={`Seleccionar ${f.texto}`}
                                    />
                                </td>
                                <td className="px-4 py-2">{f.texto}</td>
                                <td className="px-4 py-2">{ETIQUETAS_CATEGORIA[f.categoria]}</td>
                                <td className="px-4 py-2">
                                    <span className={`badge ${COLOR[f.estado]}`}>
                                        {ETIQUETAS_ESTADO_INSCRIPCION[f.estado]}
                                    </span>
                                </td>
                                <td className="px-4 py-2 text-muted">{f.llegada ? fechaCorta(f.llegada) : "—"}</td>
                                <td className="px-4 py-2 text-muted">{fechaCorta(f.alta)}</td>
                                <td className="px-4 py-2">
                                    <div className="flex justify-end gap-3">
                                        {f.estado === "pendiente" && (
                                            <button
                                                type="button"
                                                disabled={pendiente}
                                                onClick={() =>
                                                    ejecutar(() => confirmarInscripcion({ inscripcionId: f.id }), "Inscripción confirmada y avisada")
                                                }
                                                className="underline disabled:opacity-50"
                                            >
                                                Confirmar
                                            </button>
                                        )}
                                        {(f.estado === "pendiente" || f.estado === "confirmada") && (
                                            <button
                                                type="button"
                                                disabled={pendiente}
                                                onClick={() =>
                                                    ejecutar(() => marcarPagadaEnPrueba({ inscripcionId: f.id }), "Marcada como pagada")
                                                }
                                                className="underline disabled:opacity-50"
                                            >
                                                Pagada
                                            </button>
                                        )}
                                        {f.estado !== "retirada" && (
                                            <button
                                                type="button"
                                                disabled={pendiente}
                                                onClick={() => baja(f)}
                                                className="text-danger underline disabled:opacity-50"
                                            >
                                                Dar de baja
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}