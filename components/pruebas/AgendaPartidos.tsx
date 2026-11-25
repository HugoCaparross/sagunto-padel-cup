import {
    CATEGORIAS,
    ETIQUETAS_CATEGORIA,
    ETIQUETAS_CUADRO,
} from "@/lib/constantes";
import { fechaCorta } from "@/lib/formato";
import type { PartidoPublico } from "@/lib/pruebas/publico";

const ETIQUETA_RONDA: Record<string, string> = {
    round_robin: "Todos contra todos",
    cuartos: "Cuartos",
    semifinal: "Semifinal",
    final: "Final",
};

function etiquetaPartido(p: PartidoPublico): string {
    if (p.fase === "grupo") return p.grupo ? `Grupo ${p.grupo}` : "Grupo";
    const ronda = ETIQUETA_RONDA[p.ronda ?? ""] ?? "Eliminatoria";
    return p.cuadro ? `${ronda} · ${ETIQUETAS_CUADRO[p.cuadro]}` : ronda;
}

export default function AgendaPartidos({ partidos }: { partidos: PartidoPublico[] }) {
    if (partidos.length === 0) {
        return (
            <p className="rounded-xl bg-white p-6 text-sm text-[var(--color-muted)] ring-1 ring-[var(--color-border)]">
                Los partidos se publicarán cuando el organizador genere los cuadros.
            </p>
        );
    }

    return (
        <div className="space-y-8">
            {CATEGORIAS.map((c) => {
                const lista = partidos.filter((p) => p.categoria === c);
                if (lista.length === 0) return null;

                return (
                    <section key={c} className="space-y-3">
                        <h3 className="font-semibold">{ETIQUETAS_CATEGORIA[c]}</h3>
                        <ul className="divide-y divide-[var(--color-border)] overflow-hidden rounded-xl bg-white ring-1 ring-[var(--color-border)]">
                            {lista.map((p) => (
                                <li
                                    key={p.id}
                                    className="grid gap-2 px-4 py-3 text-sm md:grid-cols-[160px_1fr_auto] md:items-center"
                                >
                                    <span className="text-sm text-[var(--color-muted)]">{etiquetaPartido(p)}</span>
                                    <span>
                                        {p.ladoA} <span className="text-[var(--color-muted)]">vs</span> {p.ladoB}
                                    </span>
                                    <span className="text-sm text-[var(--color-muted)] md:text-right">
                                        {p.pista !== null && p.hora && p.fecha
                                            ? `Pista ${p.pista} · ${fechaCorta(p.fecha)} ${p.hora}`
                                            : "Horario por confirmar"}
                                        {p.resultado && (
                                            <span className="ml-3 font-medium text-[var(--color-ink)]">{p.resultado}</span>
                                        )}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </section>
                );
            })}
        </div>
    );
}