import Link from "next/link";
import {
    ETIQUETAS_CATEGORIA,
    ETIQUETAS_ESTADO_PRUEBA,
} from "@/lib/constantes";
import { euros, fechaLarga } from "@/lib/formato";
import type { PruebaHome } from "@/lib/home/datos";

type Props = { prueba: PruebaHome | null };

export default function ProximaPrueba({ prueba }: Props) {
    if (!prueba) {
        return (
            <section className="rounded-2xl bg-white p-8 text-[#68737D] ring-1 ring-[#D5D9DC]">
                No hay pruebas próximas por el momento.
            </section>
        );
    }

    const inscribible = prueba.estado === "abierta";

    return (
        <section className="grid gap-6 rounded-2xl bg-white p-6 ring-1 ring-[#D5D9DC] md:grid-cols-[1fr_auto] md:p-8">
            <div className="space-y-3">
                <p className="text-xs uppercase tracking-wide text-[#68737D]">Próxima prueba</p>
                <h2 className="heading-font text-4xl">
                    {prueba.nombre}
                    {prueba.esMaster && " · MÁSTER"}
                </h2>
                <p className="text-sm text-[#68737D]">
                    {fechaLarga(prueba.fechaInicio)}
                    {prueba.fechaFin !== prueba.fechaInicio && ` y ${fechaLarga(prueba.fechaFin)}`} ·{" "}
                    {prueba.sede}
                </p>
                <p className="text-sm">
                    <span className="font-medium">{euros(prueba.precioCentimos)}</span> por pareja, en
                    efectivo el primer día
                </p>
                <ul className="flex flex-wrap gap-2 text-xs">
                    {prueba.categorias.map((c) => (
                        <li key={c} className="rounded-full bg-[#F4F5F4] px-3 py-1">
                            {ETIQUETAS_CATEGORIA[c]}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="flex flex-col items-start justify-between gap-4 md:items-end">
                <span className="rounded-full bg-[#0D1B2A] px-3 py-1 text-xs text-white">
                    {ETIQUETAS_ESTADO_PRUEBA[prueba.estado]}
                </span>

                {inscribible ? (
                    <>
                        <p className="text-sm text-[#16845B]">
                            {prueba.plazasLibres > 0
                                ? `${prueba.plazasLibres} plazas libres`
                                : "Completa: entrarás en lista de espera"}
                        </p>
                        <Link
                            href={`/inscribirse/${prueba.slug}`}
                            className="rounded-lg bg-[#F0443A] px-4 py-2 text-sm font-medium text-white"
                        >
                            Inscribirme
                        </Link>
                    </>
                ) : (
                    <p className="text-sm text-[#68737D]">Las inscripciones se abrirán próximamente.</p>
                )}
            </div>
        </section>
    );
}