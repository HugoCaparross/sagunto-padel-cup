"use client";

import Boton from "@/components/ui/Boton";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
    confirmarPropuesta,
    generarPropuestas,
    modificarPropuesta,
} from "@/actions/ranking";
import { CATEGORIAS, ETIQUETAS_CATEGORIA, type Categoria } from "@/lib/constantes";
import type { PropuestaAdmin } from "@/lib/ranking/admin-datos";

type Props = {
    temporadaId: number;
    destino: { id: number; anio: string } | null;
    referencia: string;
    propuestas: PropuestaAdmin[];
};

type Mensaje = { tipo: "ok" | "error"; texto: string } | null;

const ETIQUETA_ESTADO = {
    pendiente: "Pendiente",
    confirmada: "Confirmada",
    modificada: "Modificada",
} as const;

export default function PanelPropuestas({
    temporadaId,
    destino,
    referencia,
    propuestas,
}: Props) {
    const router = useRouter();
    const [pendiente, startTransition] = useTransition();
    const [mensaje, setMensaje] = useState<Mensaje>(null);
    const [fecha, setFecha] = useState(referencia);

    const [editando, setEditando] = useState<string | null>(null);
    const [categoriaFinal, setCategoriaFinal] = useState<Categoria>("segunda");
    const [motivo, setMotivo] = useState("");

    const hayPendientes = propuestas.some((p) => p.estado === "pendiente");

    function generar(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!destino) return;
        if (
            hayPendientes &&
            !window.confirm("Hay propuestas pendientes. Se sustituirán por las nuevas. ¿Continuar?")
        ) {
            return;
        }

        setMensaje(null);
        startTransition(async () => {
            const res = await generarPropuestas({
                temporadaCerradaId: temporadaId,
                temporadaDestinoId: destino.id,
                referencia: fecha,
            });
            if (res.ok) {
                setMensaje({ tipo: "ok", texto: `Generadas ${res.total ?? 0} propuestas` });
                router.refresh();
            } else {
                setMensaje({ tipo: "error", texto: res.error });
            }
        });
    }

    function confirmar(id: string) {
        setMensaje(null);
        startTransition(async () => {
            const res = await confirmarPropuesta({ propuestaId: id });
            if (res.ok) {
                setMensaje({ tipo: "ok", texto: "Propuesta confirmada" });
                router.refresh();
            } else {
                setMensaje({ tipo: "error", texto: res.error });
            }
        });
    }

    function abrirModificar(p: PropuestaAdmin) {
        setEditando(p.id);
        setCategoriaFinal(p.categoriaFinal ?? p.categoriaPropuesta);
        setMotivo("");
        setMensaje(null);
    }

    function guardarModificacion(id: string) {
        if (motivo.trim().length < 10) {
            setMensaje({ tipo: "error", texto: "El motivo debe tener al menos 10 caracteres" });
            return;
        }
        setMensaje(null);
        startTransition(async () => {
            const res = await modificarPropuesta({
                propuestaId: id,
                categoriaFinal,
                motivo,
            });
            if (res.ok) {
                setEditando(null);
                setMensaje({ tipo: "ok", texto: "Propuesta modificada" });
                router.refresh();
            } else {
                setMensaje({ tipo: "error", texto: res.error });
            }
        });
    }

    const campo = "rounded-md border border-[var(--color-border)] bg-white px-2 py-1.5 text-sm";

    return (
        <div className="space-y-4">
            <form
                onSubmit={generar}
                className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 text-sm ring-1 ring-[var(--color-border)]"
            >
                {destino ? (
                    <>
                        <p className="w-full text-[var(--color-muted)]">
                            Se generan para la temporada <span className="font-medium text-[var(--color-ink)]">{destino.anio}</span>.
                            Usa el ranking con fecha de corte:
                        </p>
                        <input
                            type="date"
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                            required
                            className={campo}
                        />
                        <Boton variante="primario" tamano="md"
                            type="submit"
                            disabled={pendiente}
                            className="font-medium disabled:opacity-50"
                        >
                            {pendiente ? "Generando…" : "Generar propuestas"}
                        </Boton>
                    </>
                ) : (
                    <p className="text-[var(--color-warning)]">
                        No hay una temporada posterior. Créala antes de generar propuestas.
                    </p>
                )}
            </form>

            {mensaje && (
                <p
                    className={`rounded-lg p-3 text-sm ${mensaje.tipo === "ok" ? "bg-[var(--color-success-bg)] text-[var(--color-success)]" : "bg-[var(--color-danger-bg)] text-[var(--color-danger)]"
                        }`}
                >
                    {mensaje.texto}
                </p>
            )}

            {propuestas.length === 0 ? (
                <p className="text-sm text-[var(--color-muted)]">Todavía no hay propuestas para esta temporada.</p>
            ) : (
                <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-[var(--color-border)]">
                    <table className="w-full text-sm">
                        <thead className="bg-[var(--color-surface)] text-left text-xs uppercase text-[var(--color-muted)]">
                            <tr>
                                <th className="px-3 py-2">Jugador</th>
                                <th className="px-3 py-2">Movimiento</th>
                                <th className="px-3 py-2">Posición</th>
                                <th className="px-3 py-2">Estado</th>
                                <th className="px-3 py-2 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {propuestas.map((p) => (
                                <>
                                    <tr key={p.id} className="border-t border-[var(--color-border)]">
                                        <td className="px-3 py-2">{p.nombre}</td>
                                        <td className="px-3 py-2">
                                            <span className="text-xs text-[var(--color-muted)]">
                                                {p.tipo === "ascenso" ? "Ascenso" : "Descenso"}:
                                            </span>{" "}
                                            {ETIQUETAS_CATEGORIA[p.categoriaOrigen]} →{" "}
                                            {ETIQUETAS_CATEGORIA[p.categoriaFinal ?? p.categoriaPropuesta]}
                                        </td>
                                        <td className="px-3 py-2">
                                            {p.posicion}
                                            {p.empate && (
                                                <span className="ml-2 rounded bg-[var(--color-warning-bg)] px-1.5 py-0.5 text-xs text-[var(--color-warning)]">
                                                    Empate
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2">
                                            {ETIQUETA_ESTADO[p.estado]}
                                            {p.estado === "modificada" && p.motivo && (
                                                <span className="block text-xs text-[var(--color-muted)]">{p.motivo}</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2">
                                            {p.estado === "pendiente" && (
                                                <div className="flex justify-end gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => confirmar(p.id)}
                                                        disabled={pendiente}
                                                        className="underline disabled:opacity-50"
                                                    >
                                                        Confirmar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => abrirModificar(p)}
                                                        disabled={pendiente}
                                                        className="underline disabled:opacity-50"
                                                    >
                                                        Modificar
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>

                                    {editando === p.id && (
                                        <tr key={`${p.id}-editar`} className="bg-[var(--color-surface)]">
                                            <td colSpan={5} className="px-3 py-3">
                                                <div className="flex flex-wrap items-end gap-3">
                                                    <label className="flex flex-col gap-1 text-sm">
                                                        <span className="text-[var(--color-muted)]">Categoría final</span>
                                                        <select
                                                            value={categoriaFinal}
                                                            onChange={(e) => setCategoriaFinal(e.target.value as Categoria)}
                                                            className={campo}
                                                        >
                                                            {CATEGORIAS.map((c) => (
                                                                <option key={c} value={c}>
                                                                    {ETIQUETAS_CATEGORIA[c]}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </label>

                                                    <label className="flex min-w-[240px] flex-1 flex-col gap-1 text-sm">
                                                        <span className="text-[var(--color-muted)]">Motivo (mínimo 10 caracteres)</span>
                                                        <input
                                                            value={motivo}
                                                            onChange={(e) => setMotivo(e.target.value)}
                                                            maxLength={500}
                                                            className={campo}
                                                        />
                                                    </label>

                                                    <Boton variante="secundario" tamano="md"
                                                        type="button"
                                                        onClick={() => guardarModificacion(p.id)}
                                                        disabled={pendiente}
                                                        className="disabled:opacity-50"
                                                    >
                                                        Guardar
                                                    </Boton>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditando(null)}
                                                        disabled={pendiente}
                                                        className="text-sm text-[var(--color-muted)] underline"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
