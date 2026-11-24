"use client";

import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import type { DatosAnalitica } from "@/lib/analitica/datos";

type Props = Pick<DatosAnalitica, "semanal" | "participacion" | "retencion" | "categorias">;

const COLORES = ["#F0443A", "#0D1B2A", "#A7C4A0", "#B77912"];

function Bloque({ titulo, vacio, children }: { titulo: string; vacio: boolean; children: React.ReactNode }) {
    return (
        <section className="card space-y-3 p-5">
            <h2 className="font-semibold">{titulo}</h2>
            {vacio ? (
                <p className="py-16 text-center text-sm text-muted">Sin datos todavía.</p>
            ) : (
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <>{children}</>
                    </ResponsiveContainer>
                </div>
            )}
        </section>
    );
}

export default function Graficas({ semanal, participacion, retencion, categorias }: Props) {
    const semanaVacia = semanal.every((s) => s.inscripciones === 0);

    return (
        <div className="grid gap-6 xl:grid-cols-2">
            <Bloque titulo="Inscripciones por semana" vacio={semanaVacia}>
                <BarChart data={semanal}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D5D9DC" />
                    <XAxis dataKey="semana" fontSize={12} />
                    <YAxis allowDecimals={false} fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="inscripciones" fill="#F0443A" radius={[4, 4, 0, 0]} />
                </BarChart>
            </Bloque>

            <Bloque titulo="Parejas por prueba" vacio={participacion.every((p) => p.parejas === 0)}>
                <BarChart data={participacion}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D5D9DC" />
                    <XAxis dataKey="prueba" fontSize={12} />
                    <YAxis allowDecimals={false} fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="parejas" fill="#0D1B2A" radius={[4, 4, 0, 0]} />
                </BarChart>
            </Bloque>

            <Bloque titulo="Retención entre pruebas (%)" vacio={retencion.length === 0}>
                <BarChart data={retencion}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D5D9DC" />
                    <XAxis dataKey="a" fontSize={12} />
                    <YAxis domain={[0, 100]} fontSize={12} />
                    <Tooltip formatter={(valor) => `${valor}%`} />
                    <Bar dataKey="porcentaje" fill="#A7C4A0" radius={[4, 4, 0, 0]} />
                </BarChart>
            </Bloque>

            <Bloque titulo="Reparto por categoría" vacio={categorias.length === 0}>
                <PieChart>
                    <Tooltip />
                    <Pie data={categorias} dataKey="valor" nameKey="categoria" outerRadius={90} label>
                        {categorias.map((_, i) => (
                            <Cell key={i} fill={COLORES[i % COLORES.length]} />
                        ))}
                    </Pie>
                </PieChart>
            </Bloque>
        </div>
    );
}
