import { ETIQUETAS_CATEGORIA, ETIQUETAS_CUADRO } from "@/lib/constantes";
import { fechaLarga } from "@/lib/formato";
import type { PremioGanado } from "@/lib/patrocinio/ganados";

export default function PremiosGanados({ premios }: { premios: PremioGanado[] }) {
    if (premios.length === 0) return null;

    return (
        <section className="space-y-3">
            <h2 className="font-semibold">Premios ganados</h2>
            <ul className="grid gap-4 md:grid-cols-2">
                {premios.map((p, i) => (
                    <li key={i} className="card space-y-2 p-5">
                        <p className="text-sm uppercase tracking-wide text-muted">
                            {p.prueba} · {ETIQUETAS_CATEGORIA[p.categoria]} · {ETIQUETAS_CUADRO[p.cuadro]}
                        </p>
                        {p.revelado ? (
                            <p className="heading-font text-2xl leading-tight">{p.descripcion}</p>
                        ) : (
                            <>
                                <p className="heading-font text-2xl text-muted">Sorpresa</p>
                                {p.revelaEl && (
                                    <p className="text-sm text-muted">Se revela el {fechaLarga(p.revelaEl)}</p>
                                )}
                            </>
                        )}
                    </li>
                ))}
            </ul>
        </section>
    );
}