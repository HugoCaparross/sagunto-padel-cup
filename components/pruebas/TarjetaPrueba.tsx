import Link from "next/link";
import {
    ETIQUETAS_CATEGORIA,
    ETIQUETAS_ESTADO_PRUEBA,
    type EstadoPrueba,
} from "@/lib/constantes";
import { fechaCorta } from "@/lib/formato";
import type { PruebaPublica } from "@/lib/pruebas/publico";

const COLOR_ESTADO: Record<EstadoPrueba, string> = {
    proxima: "bg-[#E8F0FB] text-[#2767B1]",
    abierta: "bg-[#EAF6EF] text-[#16845B]",
    cerrada: "bg-[#FFF4DE] text-[#B77912]",
    en_curso: "bg-[#0D1B2A] text-white",
    finalizada: "bg-[#F4F5F4] text-[#68737D]",
};

export default function TarjetaPrueba({ prueba }: { prueba: PruebaPublica }) {
    const fechas =
        prueba.fechaFin !== prueba.fechaInicio
            ? `${fechaCorta(prueba.fechaInicio)} – ${fechaCorta(prueba.fechaFin)}`
            : fechaCorta(prueba.fechaInicio);

    return (
        <Link
            href={`/pruebas/${prueba.slug}`}
            className="block space-y-3 rounded-xl bg-white p-5 ring-1 ring-[#D5D9DC] hover:ring-[#0D1B2A]"
        >
            <div className="flex items-start justify-between gap-3">
                <p className="text-xs text-[#68737D]">{fechas}</p>
                <span className={`rounded px-2 py-0.5 text-xs ${COLOR_ESTADO[prueba.estado]}`}>
                    {ETIQUETAS_ESTADO_PRUEBA[prueba.estado]}
                </span>
            </div>

            <h2 className="heading-font text-2xl">
                {prueba.nombre}
                {prueba.esMaster && <span className="ml-2 text-[#F0443A]">· Máster</span>}
            </h2>

            <p className="text-sm text-[#68737D]">{prueba.sede}</p>

            <ul className="flex flex-wrap gap-1.5 text-xs">
                {prueba.categorias.map((c) => (
                    <li key={c} className="rounded-full bg-[#F4F5F4] px-2.5 py-0.5">
                        {ETIQUETAS_CATEGORIA[c]}
                    </li>
                ))}
            </ul>

            {prueba.estado === "abierta" && (
                <p className="text-sm text-[#16845B]">
                    {prueba.plazasLibres > 0
                        ? `${prueba.plazasLibres} plazas libres`
                        : "Completa: lista de espera"}
                </p>
            )}
        </Link>
    );
}