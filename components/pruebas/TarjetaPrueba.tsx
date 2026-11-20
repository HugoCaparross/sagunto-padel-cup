import Link from "next/link";
import {
    ETIQUETAS_CATEGORIA,
    ETIQUETAS_ESTADO_PRUEBA,
    type EstadoPrueba,
} from "@/lib/constantes";
import { fechaCorta } from "@/lib/formato";
import type { PruebaPublica } from "@/lib/pruebas/publico";
import estilos from "./TarjetaPrueba.module.css";

const ESTILO_ESTADO: Record<EstadoPrueba, string> = {
    proxima: estilos.estadoProxima,
    abierta: estilos.estadoAbierta,
    cerrada: estilos.estadoCerrada,
    en_curso: estilos.estadoEnCurso,
    finalizada: estilos.estadoFinalizada,
};

export default function TarjetaPrueba({ prueba }: { prueba: PruebaPublica }) {
    const fechas =
        prueba.fechaFin !== prueba.fechaInicio
            ? `${fechaCorta(prueba.fechaInicio)} – ${fechaCorta(prueba.fechaFin)}`
            : fechaCorta(prueba.fechaInicio);

    return (
        <Link
            href={`/pruebas/${prueba.slug}`}
            className={estilos.tarjeta}
        >
            <div className={estilos.cabecera}>
                <p className={estilos.fechas}>{fechas}</p>
                <span className={`${estilos.estado} ${ESTILO_ESTADO[prueba.estado]}`}>
                    {ETIQUETAS_ESTADO_PRUEBA[prueba.estado]}
                </span>
            </div>

            <h3 className={`heading-font ${estilos.nombre}`}>
                {prueba.nombre}
                {prueba.esMaster && <span className={estilos.master}> · Máster</span>}
            </h3>

            <p className={estilos.sede}>{prueba.sede}</p>

            <ul className={estilos.categorias}>
                {prueba.categorias.map((c) => (
                    <li key={c} className={estilos.categoria}>
                        {ETIQUETAS_CATEGORIA[c]}
                    </li>
                ))}
            </ul>

            {prueba.estado === "abierta" && (
                <p className={prueba.plazasLibres > 0 ? estilos.plazas : estilos.listaEspera}>
                    {prueba.plazasLibres > 0
                        ? `${prueba.plazasLibres} plazas libres`
                        : "Completa: lista de espera"}
                </p>
            )}

            <span className={estilos.detalle}>
                Ver detalles <span aria-hidden="true">→</span>
            </span>
        </Link>
    );
}