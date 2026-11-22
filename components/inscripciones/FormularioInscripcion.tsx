"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { crearInscripcion } from "@/actions/inscripciones";
import {
    ETIQUETAS_CATEGORIA,
    ETIQUETAS_ESTADO_INSCRIPCION,
    type Categoria,
    type EstadoInscripcion,
} from "@/lib/constantes";
import { euros, fechaLarga } from "@/lib/formato";

export type DatosInscripcion = {
    prueba: {
        id: string;
        slug: string;
        nombre: string;
        sede: string;
        fechaInicio: string;
        fechaFin: string;
        precioCentimos: number;
        estado: string;
    };
    categorias: Categoria[];
    plazasLibres: number;
    propia: { categoria: Categoria; estado: EstadoInscripcion } | null;
};

const PASOS = ["Categoría", "Confirmación", "Listo"];

export default function FormularioInscripcion({ datos }: { datos: DatosInscripcion }) {
    const { prueba, categorias, plazasLibres, propia } = datos;

    const [paso, setPaso] = useState(0);
    const [categoria, setCategoria] = useState<Categoria | null>(
        categorias.length === 1 ? categorias[0] : null
    );
    const [aceptaPago, setAceptaPago] = useState(false);
    const [resultado, setResultado] = useState<EstadoInscripcion | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [pendiente, startTransition] = useTransition();

    // Ya inscrito en esta prueba
    if (propia) {
        return (
            <section className="card space-y-4 p-6">
                <h1 className="text-xl font-semibold">Ya estás inscrito en {prueba.nombre}</h1>
                <p className="text-sm">
                    {ETIQUETAS_CATEGORIA[propia.categoria]} · {ETIQUETAS_ESTADO_INSCRIPCION[propia.estado]}
                </p>
                <Link href="/cuenta/inscripciones" className="inline-block text-sm underline">
                    Ver mis inscripciones
                </Link>
            </section>
        );
    }

    if (prueba.estado !== "abierta") {
        return (
            <section className="card space-y-2 p-6">
                <h1 className="text-xl font-semibold">{prueba.nombre}</h1>
                <p className="text-sm text-muted">Las inscripciones de esta prueba no están abiertas.</p>
            </section>
        );
    }

    if (categorias.length === 0) {
        return (
            <section className="card space-y-2 p-6">
                <h1 className="text-xl font-semibold">{prueba.nombre}</h1>
                <p className="text-sm text-muted">No hay categorías disponibles para ti en esta prueba.</p>
            </section>
        );
    }

    function confirmar() {
        if (!categoria) return;
        setError(null);
        startTransition(async () => {
            const res = await crearInscripcion({ pruebaId: prueba.id, categoria });
            if (res.ok) {
                setResultado((res.estado as EstadoInscripcion) ?? "pendiente");
                setPaso(2);
            } else {
                setError(res.error);
            }
        });
    }

    return (
        <section className="space-y-6">
            <header className="space-y-2">
                <h1 className="text-2xl font-semibold">Inscribirse en {prueba.nombre}</h1>
                <p className="text-sm text-muted">
                    {fechaLarga(prueba.fechaInicio)}
                    {prueba.fechaFin !== prueba.fechaInicio && ` – ${fechaLarga(prueba.fechaFin)}`} ·{" "}
                    {prueba.sede}
                </p>
            </header>

            <ol className="flex gap-2">
                {PASOS.map((nombre, i) => (
                    <li
                        key={nombre}
                        className={`flex-1 rounded-full py-1 text-center text-xs ${i <= paso ? "bg-navy text-white" : "bg-surface text-muted"
                            }`}
                    >
                        {nombre}
                    </li>
                ))}
            </ol>

            {paso === 0 && (
                <div className="card space-y-5 p-6">
                    <fieldset className="space-y-2">
                        <legend className="mb-2 text-sm font-medium">Elige categoría</legend>
                        {categorias.map((c) => (
                            <label
                                key={c}
                                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 text-sm"
                            >
                                <input
                                    type="radio"
                                    name="categoria"
                                    value={c}
                                    checked={categoria === c}
                                    onChange={() => setCategoria(c)}
                                />
                                {ETIQUETAS_CATEGORIA[c]}
                            </label>
                        ))}
                    </fieldset>

                    <p className="text-xs text-muted">
                        Una categoría se disputa si tiene al menos 3 parejas inscritas.
                    </p>

                    <button
                        type="button"
                        disabled={!categoria}
                        onClick={() => setPaso(1)}
                        className="btn btn-primario w-full"
                    >
                        Continuar
                    </button>
                </div>
            )}

            {paso === 1 && categoria && (
                <div className="card space-y-5 p-6">
                    <dl className="grid gap-2 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-muted">Categoría</dt>
                            <dd>{ETIQUETAS_CATEGORIA[categoria]}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-muted">Precio por pareja</dt>
                            <dd>{euros(prueba.precioCentimos)} (en efectivo)</dd>
                        </div>
                    </dl>

                    {plazasLibres === 0 ? (
                        <p className="alerta alerta-aviso">
                            La prueba está completa. Tu inscripción quedará en lista de espera.
                        </p>
                    ) : (
                        <p className="text-sm text-muted">Quedan {plazasLibres} plazas libres.</p>
                    )}

                    <label className="flex items-start gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={aceptaPago}
                            onChange={(e) => setAceptaPago(e.target.checked)}
                            className="mt-1"
                        />
                        <span>
                            Entiendo que pago en efectivo el primer día de la prueba y que la inscripción se
                            confirma cuando el organizador la valida.
                        </span>
                    </label>

                    {error && <p className="alerta alerta-error">{error}</p>}

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setPaso(0)}
                            disabled={pendiente}
                            className="btn btn-fantasma"
                        >
                            Atrás
                        </button>
                        <button
                            type="button"
                            onClick={confirmar}
                            disabled={!aceptaPago || pendiente}
                            className="btn btn-primario flex-1"
                        >
                            {pendiente ? "Inscribiendo…" : "Confirmar inscripción"}
                        </button>
                    </div>
                </div>
            )}

            {paso === 2 && resultado && (
                <div className="card space-y-4 p-6">
                    <h2 className="text-lg font-semibold">
                        {resultado === "lista_espera" ? "Estás en lista de espera" : "Inscripción registrada"}
                    </h2>
                    <p className="text-sm text-muted">
                        {resultado === "lista_espera"
                            ? "Si se libera una plaza, entrarás automáticamente."
                            : "El organizador la confirmará. Recuerda que el pago es en efectivo el primer día."}
                    </p>

                    <div className="space-y-2 rounded-lg bg-surface p-4 text-sm">
                        <p className="font-medium">¿Vas con pareja?</p>
                        <p className="text-muted">
                            Tu compañero o compañera puede unirse desde el tablón de búsqueda de pareja. Tiene
                            que tener cuenta en la web.
                        </p>
                        <Link href={`/buscar-pareja?prueba=${prueba.slug}`} className="inline-block underline">
                            Ir al tablón de pareja
                        </Link>
                    </div>

                    <Link href="/cuenta/inscripciones" className="block text-sm underline">
                        Ver mis inscripciones
                    </Link>
                </div>
            )}
        </section>
    );
}