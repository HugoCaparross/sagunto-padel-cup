import Link from "next/link";
import TarjetaPremio from "@/components/patrocinio/TarjetaPremio";
import { ETIQUETAS_CATEGORIA, ETIQUETAS_CUADRO } from "@/lib/constantes";
import type { PremioPublico } from "@/lib/patrocinio/publico";

type Props = { premios: PremioPublico[] };

// Los premios de oro se muestran con su contenido (o bloqueados hasta su fecha).
// El resto aparece siempre como sorpresa: su descripción no se renderiza en la portada.
export default function PremiosDestacados({ premios }: Props) {
    if (premios.length === 0) return null;

    const oro = premios.filter((p) => p.cuadro === "oro");
    const resto = premios.filter((p) => p.cuadro !== "oro");

    return (
        <section className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <h2 className="heading-font text-4xl">Premios</h2>
                <Link href="/premios" className="text-sm underline">
                    Todos los premios
                </Link>
            </div>

            {oro.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {oro.map((p) => (
                        <TarjetaPremio key={p.id} premio={p} />
                    ))}
                </div>
            )}

            {resto.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    {resto.map((p) => (
                        <div
                            key={p.id}
                            className="space-y-1 rounded-xl bg-surface p-4 text-center ring-1 ring-border"
                        >
                            <p className="heading-font text-xl text-muted">Sorpresa</p>
                            <p className="text-xs text-muted">
                                {ETIQUETAS_CATEGORIA[p.categoria]} · {ETIQUETAS_CUADRO[p.cuadro]}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}