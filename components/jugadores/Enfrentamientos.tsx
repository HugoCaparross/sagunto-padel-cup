"use client";

import { useState, useTransition } from "react";
import { obtenerEnfrentamientos } from "@/actions/estadisticas";

type Props = {
    jugadorId: string;
    jugadorNombre: string;
    candidatos: { id: string; nombre: string }[];
};

type Resultado = {
    partidos: number;
    victoriasA: number;
    victoriasB: number;
    nombreRival: string;
};

export default function Enfrentamientos({ jugadorId, jugadorNombre, candidatos }: Props) {
    const [rivalId, setRivalId] = useState("");
    const [resultado, setResultado] = useState<Resultado | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [pendiente, startTransition] = useTransition();

    function consultar(id: string) {
        setRivalId(id);
        setResultado(null);
        setError(null);
        if (!id) return;

        startTransition(async () => {
            const res = await obtenerEnfrentamientos({
                ladoA: [jugadorId],
                ladoB: [id],
                modo: "contiene",
            });
            if (res.ok) {
                setResultado({
                    partidos: res.resultado.partidos,
                    victoriasA: res.resultado.victoriasA,
                    victoriasB: res.resultado.victoriasB,
                    nombreRival: candidatos.find((c) => c.id === id)?.nombre ?? "Jugador",
                });
            } else {
                setError(res.error);
            }
        });
    }

    if (candidatos.length === 0) {
        return <p className="text-sm text-[#68737D]">No hay otros jugadores públicos todavía.</p>;
    }

    return (
        <div className="space-y-4 rounded-xl bg-white p-5 ring-1 ring-[#D5D9DC]">
            <label className="flex flex-col gap-1 text-sm">
                <span className="text-[#68737D]">Compara con otro jugador</span>
                <select
                    value={rivalId}
                    onChange={(e) => consultar(e.target.value)}
                    className="rounded-md border border-[#D5D9DC] bg-white px-2 py-1.5"
                >
                    <option value="">Elige un jugador</option>
                    {candidatos.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.nombre}
                        </option>
                    ))}
                </select>
            </label>

            {pendiente && <p className="text-sm text-[#68737D]">Calculando…</p>}

            {error && <p className="text-sm text-[#C73535]">{error}</p>}

            {resultado && (
                <div className="space-y-2 text-sm">
                    <p className="text-[#68737D]">
                        {resultado.partidos === 0
                            ? `${jugadorNombre} y ${resultado.nombreRival} no se han enfrentado todavía.`
                            : `${resultado.partidos} partidos entre ambos`}
                    </p>
                    {resultado.partidos > 0 && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-lg bg-[#F4F5F4] p-3 text-center">
                                <p className="text-xs text-[#68737D]">{jugadorNombre}</p>
                                <p className="text-2xl font-semibold">{resultado.victoriasA}</p>
                            </div>
                            <div className="rounded-lg bg-[#F4F5F4] p-3 text-center">
                                <p className="text-xs text-[#68737D]">{resultado.nombreRival}</p>
                                <p className="text-2xl font-semibold">{resultado.victoriasB}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}