"use client";

import { useState } from "react";
import {
    CATEGORIAS,
    CUADROS,
    ETIQUETAS_CATEGORIA,
    ETIQUETAS_CUADRO,
    ETIQUETAS_RONDA,
    RONDAS,
    type Categoria,
    type Cuadro,
    type Ronda,
} from "@/lib/constantes";
import { puntosPara } from "@/lib/puntos/escala";

export default function SimuladorPuntos() {
    const [categoria, setCategoria] = useState<Categoria>("segunda");
    const [cuadro, setCuadro] = useState<Cuadro>("oro");
    const [ronda, setRonda] = useState<Ronda>("semifinalista");

    const puntos = puntosPara(categoria, cuadro, ronda);

    const selectClase =
        "rounded-md border border-[#D5D9DC] bg-white px-3 py-2 text-sm";

    return (
        <div className="space-y-6 rounded-xl bg-white p-6 ring-1 ring-[#D5D9DC]">
            <div className="grid gap-4 sm:grid-cols-3">
                <label className="flex flex-col gap-1 text-sm">
                    <span className="text-[#68737D]">Categoría</span>
                    <select
                        value={categoria}
                        onChange={(e) => setCategoria(e.target.value as Categoria)}
                        className={selectClase}
                    >
                        {CATEGORIAS.map((c) => (
                            <option key={c} value={c}>
                                {ETIQUETAS_CATEGORIA[c]}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="flex flex-col gap-1 text-sm">
                    <span className="text-[#68737D]">Cuadro</span>
                    <select
                        value={cuadro}
                        onChange={(e) => setCuadro(e.target.value as Cuadro)}
                        className={selectClase}
                    >
                        {CUADROS.map((q) => (
                            <option key={q} value={q}>
                                {ETIQUETAS_CUADRO[q]}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="flex flex-col gap-1 text-sm">
                    <span className="text-[#68737D]">Ronda alcanzada</span>
                    <select
                        value={ronda}
                        onChange={(e) => setRonda(e.target.value as Ronda)}
                        className={selectClase}
                    >
                        {RONDAS.map((r) => (
                            <option key={r} value={r}>
                                {ETIQUETAS_RONDA[r]}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <div className="flex items-baseline justify-between rounded-lg bg-[#F4F5F4] p-4">
                <span className="text-sm text-[#68737D]">Puntos por jugador</span>
                <span className="heading-font text-5xl text-[#F0443A]">{puntos}</span>
            </div>
        </div>
    );
}