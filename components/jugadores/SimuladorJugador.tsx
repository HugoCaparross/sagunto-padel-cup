"use client";

import { useState, useTransition } from "react";
import { simularTorneo, type DatosSimulador } from "@/actions/simulador";
import { CATEGORIAS, ETIQUETAS_CATEGORIA, type Categoria } from "@/lib/constantes";

type Props = {
    pruebas?: { id: string; nombre: string }[];
};

export default function SimuladorJugador({ pruebas = [] }: Props) {
    const [pruebaId, setPruebaId] = useState(pruebas[0]?.id ?? "");
    const [categoria, setCategoria] = useState<Categoria>("segunda");
    const [datos, setDatos] = useState<DatosSimulador | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [pendiente, startTransition] = useTransition();

    function simular() {
        if (!pruebaId) return;
        setError(null);
        setDatos(null);

        startTransition(async () => {
            const res = await simularTorneo({ pruebaId, categoria });
            if (res.ok) setDatos(res.datos);
            else setError(res.error);
        });
    }

    return (
        <div className="space-y-4 text-sm">
            {pruebas.length === 0 ? (
                <p className="text-[#68737D]">No tienes inscripciones para simular.</p>
            ) : (
                <>
                    <label className="flex flex-col gap-1">
                        <span className="text-[#68737D]">Prueba</span>
                        <select
                            value={pruebaId}
                            onChange={(e) => setPruebaId(e.target.value)}
                            className="rounded-md border border-[#D5D9DC] bg-white px-2 py-1.5"
                        >
                            {pruebas.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.nombre}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="flex flex-col gap-1">
                        <span className="text-[#68737D]">Categoría</span>
                        <select
                            value={categoria}
                            onChange={(e) => setCategoria(e.target.value as Categoria)}
                            className="rounded-md border border-[#D5D9DC] bg-white px-2 py-1.5"
                        >
                            {CATEGORIAS.map((c) => (
                                <option key={c} value={c}>
                                    {ETIQUETAS_CATEGORIA[c]}
                                </option>
                            ))}
                        </select>
                    </label>

                    <button
                        type="button"
                        onClick={simular}
                        disabled={pendiente || !pruebaId}
                        className="w-full rounded-lg bg-[#0D1B2A] px-3 py-2 text-white disabled:opacity-50"
                    >
                        {pendiente ? "Calculando…" : "Simular"}
                    </button>

                    {error && <p className="text-[#C73535]">{error}</p>}

                    {datos && (
                        <div className="space-y-4">
                            {datos.avisos.map((a) => (
                                <p key={a} className="rounded-lg bg-[#FFF4DE] p-2 text-xs text-[#B77912]">
                                    {a}
                                </p>
                            ))}

                            {datos.proximoPartido && (
                                <div className="rounded-lg bg-[#F4F5F4] p-3 text-xs">
                                    <p className="font-medium">Próximo partido</p>
                                    <p>Si ganas: {datos.proximoPartido.siGana}</p>
                                    <p>Si pierdes: {datos.proximoPartido.siPierde.texto}</p>
                                </div>
                            )}

                            {datos.cuadros.map((c) => (
                                <div key={c.cuadro} className="space-y-2">
                                    <p className="font-medium capitalize">{c.cuadro}</p>
                                    <ul className="divide-y divide-[#D5D9DC]">
                                        {c.filas
                                            .filter((f) => f.alcanzable)
                                            .map((f) => (
                                                <li key={f.ronda} className="flex justify-between py-1.5 text-xs">
                                                    <span>{f.etiqueta}</span>
                                                    <span>
                                                        {f.puntos} pts
                                                        {f.posicionProyectada !== null && (
                                                            <span className="text-[#68737D]"> · {f.posicionProyectada}.º</span>
                                                        )}
                                                    </span>
                                                </li>
                                            ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}