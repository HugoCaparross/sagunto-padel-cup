"use client";

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

    const campo = "rounded-md border border-[#D5D9DC] bg-white px-2 py-1.5 text-sm";

    return (
        <div className="space-y-4">
            <form
                onSubmit={generar}
                className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 text-sm ring-1 ring-[#D5D9DC]"
            >
                {destino ? (
                    <>
                        <p className="w-full text-[#68737D]">
                            Se generan para la temporada <span className="font-medium text-[#18232D]">{destino.anio}</span>.
                            Usa el ranking con fecha de corte:
                        </p>
                        <input
                            type="date"
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                            required
                            className={campo}
                        />
                        <button
                            type="submit"
                            disabled={pendiente}
                            className="rounded-lg bg-[#F0443A] px-4 py-2 font-medium text-white disabled:opacity-50"
                        >
                            {pendiente ? "Generando…" : "Generar propuestas"}
                        </button>
                    </>
                ) : (
                    <p className="text-[#B77912]">
                        No hay una temporada posterior. Créala antes de generar propuestas.
                    </p>
                )}
            </form>

            {mensaje && (
                <p
                    className={`rounded-lg p-3 text-sm ${mensaje.tipo === "ok" ? "bg-[#EAF6EF] text-[#16845B]" : "bg-[#FDECEC] text-[#C73535]"
                        }`}
                >
                    {mensaje.texto}
                </p>
            )}

            {propuestas.length === 0 ? (
                <p className="text-sm text-[#68737D]">Todavía no hay propuestas para esta temporada.</p>
            ) : (
                <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-[#D5D9DC]">
                    <table className="w-full text-sm">
                        <thead className="bg-[#F4F5F4] text-left text-xs uppercase text-[#68737D]">
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
                                    <tr key={p.id} className="border-t border-[#D5D9DC]">
                                        <td className="px-3 py-2">{p.nombre}</td>
                                        <td className="px-3 py-2">
                                            <span className="text-xs text-[#68737D]">
                                                {p.tipo === "ascenso" ? "Ascenso" : "Descenso"}:
                                            </span>{" "}
                                            {ETIQUETAS_CATEGORIA[p.categoriaOrigen]} →{" "}
                                            {ETIQUETAS_CATEGORIA[p.categoriaFinal ?? p.categoriaPropuesta]}
                                        </td>
                                        <td className="px-3 py-2">
                                            {p.posicion}
                                            {p.empate && (
                                                <span className="ml-2 rounded bg-[#FFF4DE] px-1.5 py-0.5 text-xs text-[#B77912]">
                                                    Empate
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2">
                                            {ETIQUETA_ESTADO[p.estado]}
                                            {p.estado === "modificada" && p.motivo && (
                                                <span className="block text-xs text-[#68737D]">{p.motivo}</span>
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
                                        <tr key={`${p.id}-editar`} className="bg-[#F4F5F4]">
                                            <td colSpan={5} className="px-3 py-3">
                                                <div className="flex flex-wrap items-end gap-3">
                                                    <label className="flex flex-col gap-1 text-sm">
                                                        <span className="text-[#68737D]">Categoría final</span>
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
                                                        <span className="text-[#68737D]">Motivo (mínimo 10 caracteres)</span>
                                                        <input
                                                            value={motivo}
                                                            onChange={(e) => setMotivo(e.target.value)}
                                                            maxLength={500}
                                                            className={campo}
                                                        />
                                                    </label>

                                                    <button
                                                        type="button"
                                                        onClick={() => guardarModificacion(p.id)}
                                                        disabled={pendiente}
                                                        className="rounded-lg bg-[#0D1B2A] px-3 py-2 text-sm text-white disabled:opacity-50"
                                                    >
                                                        Guardar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditando(null)}
                                                        disabled={pendiente}
                                                        className="text-sm text-[#68737D] underline"
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