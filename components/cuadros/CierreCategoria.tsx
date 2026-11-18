"use client";

import { useState } from "react";
import {
    calcularPosicionesCategoria,
    cerrarCategoria,
    type PosicionPreview,
} from "@/actions/cierre";
import {
    ETIQUETAS_CUADRO,
    ETIQUETAS_RONDA,
    type Categoria,
} from "@/lib/constantes";

type Props = {
    pruebaId: string;
    categoria: Categoria;
};

export default function CierreCategoria({ pruebaId, categoria }: Props) {
    const [filas, setFilas] = useState<PosicionPreview[] | null>(null);
    const [requiereMotivo, setRequiereMotivo] = useState(false);
    const [razon, setRazon] = useState("");
    const [motivos, setMotivos] = useState<string[]>([]);
    const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(
        null
    );
    const [cargando, setCargando] = useState(false);

    async function calcular() {
        setCargando(true);
        setMensaje(null);
        setMotivos([]);

        const res = await calcularPosicionesCategoria({ pruebaId, categoria });

        setCargando(false);
        if (res.ok) {
            setFilas(res.filas);
            setRequiereMotivo(res.requiereMotivo);
            setRazon(res.motivoDe);
        } else {
            setFilas(null);
            setMensaje({ tipo: "error", texto: res.error });
            setMotivos(res.motivos ?? []);
        }
    }

    async function publicar() {
        let motivo: string | undefined;
        if (requiereMotivo) {
            const m = window.prompt(
                `${razon}. Indica el motivo (mínimo 10 caracteres):`
            );
            if (!m) return;
            motivo = m;
        }

        setCargando(true);
        setMensaje(null);

        const res = await cerrarCategoria({ pruebaId, categoria, motivo });

        setCargando(false);
        if (res.ok) {
            setMensaje({
                tipo: "ok",
                texto: `Posiciones publicadas para ${res.publicadas} parejas.`,
            });
            setFilas(null);
        } else {
            setMensaje({ tipo: "error", texto: res.error });
        }
    }

    return (
        <section className="space-y-4 rounded-xl bg-white p-4 ring-1 ring-[#D5D9DC]">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold">Cierre de categoría</h2>
                    <p className="text-sm text-[#68737D]">
                        Calcula las posiciones finales a partir de los resultados y publica los puntos.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={calcular}
                        disabled={cargando}
                        className="rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-[#D5D9DC] disabled:opacity-50"
                    >
                        Calcular posiciones
                    </button>
                    <button
                        type="button"
                        onClick={publicar}
                        disabled={cargando || !filas}
                        className="rounded-lg bg-[#F0443A] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                    >
                        {cargando ? "Procesando…" : "Publicar puntos"}
                    </button>
                </div>
            </header>

            {motivos.length > 0 && (
                <div className="rounded-lg bg-[#FFF4DE] p-3 text-sm text-[#B77912]">
                    {motivos.map((m) => (
                        <p key={m}>{m}</p>
                    ))}
                </div>
            )}

            {filas && (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-left text-xs uppercase text-[#68737D]">
                            <tr>
                                <th className="py-2">Pareja</th>
                                <th className="py-2">Cuadro</th>
                                <th className="py-2">Resultado</th>
                                <th className="py-2 text-right">Puntos por jugador</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filas.map((f) => (
                                <tr key={f.inscripcionId} className="border-t border-[#D5D9DC]">
                                    <td className="py-2">{f.texto}</td>
                                    <td className="py-2">{ETIQUETAS_CUADRO[f.cuadro]}</td>
                                    <td className="py-2">{ETIQUETAS_RONDA[f.ronda]}</td>
                                    <td className="py-2 text-right font-medium">{f.puntosPorJugador}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {requiereMotivo && (
                        <p className="mt-3 text-xs text-[#B77912]">
                            {razon}. Al publicar se pedirá un motivo.
                        </p>
                    )}
                </div>
            )}

            {mensaje && (
                <div
                    className={`rounded-lg p-3 text-sm ${mensaje.tipo === "ok"
                            ? "bg-[#EAF6EF] text-[#16845B]"
                            : "bg-[#FDECEC] text-[#C73535]"
                        }`}
                >
                    {mensaje.texto}
                </div>
            )}
        </section>
    );
}