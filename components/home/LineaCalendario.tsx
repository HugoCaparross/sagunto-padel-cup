import Link from "next/link";
import { ETIQUETAS_ESTADO_PRUEBA } from "@/lib/constantes";
import { fechaCorta } from "@/lib/formato";
import type { PruebaHome } from "@/lib/home/datos";

type Props = {
    pruebas: PruebaHome[];
    proximaId: string | null;
};

export default function LineaCalendario({ pruebas, proximaId }: Props) {
    return (
        <section className="space-y-6">
            <div className="flex items-end justify-between gap-4">
                <h2 className="heading-font text-4xl">Calendario</h2>
                <Link href="/calendario" className="text-sm underline">
                    Ver todas
                </Link>
            </div>

            <ol className="flex snap-x gap-4 overflow-x-auto pb-4">
                {pruebas.map((p) => {
                    const actual = p.id === proximaId;
                    return (
                        <li
                            key={p.id}
                            className={`min-w-[210px] snap-start rounded-xl p-4 ring-1 ${actual ? "bg-[#0D1B2A] text-white ring-[#0D1B2A]" : "bg-white ring-[#D5D9DC]"
                                }`}
                        >
                            <p className="text-xs opacity-70">{fechaCorta(p.fechaInicio)}</p>
                            <p className="mt-1 font-medium">
                                {p.nombre}
                                {p.esMaster && " · Máster"}
                            </p>
                            <p className="text-xs opacity-70">{p.sede}</p>
                            <p className="mt-3 text-xs">{ETIQUETAS_ESTADO_PRUEBA[p.estado]}</p>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}