"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { crearInscripcion } from "@/actions/inscripciones";
import { ETIQUETAS_CATEGORIA, ETIQUETAS_ESTADO_INSCRIPCION, type Categoria, type EstadoInscripcion } from "@/lib/constantes";
import { euros, fechaLarga } from "@/lib/formato";
import Aviso from "@/components/ui/Aviso";

export type DatosInscripcion = {
    prueba: { id: string; slug: string; nombre: string; sede: string; fechaInicio: string; fechaFin: string; precioCentimos: number; estado: string };
    categorias: Categoria[];
    plazasLibres: number;
    propia: { categoria: Categoria; estado: EstadoInscripcion } | null;
};

export default function FormularioInscripcion({ datos }: { datos: DatosInscripcion }) {
    const { prueba, categorias, plazasLibres, propia } = datos;
    const [categoria, setCategoria] = useState<Categoria | null>(categorias.length === 1 ? categorias[0] : null);
    const [acepta, setAcepta] = useState(false);
    const [resultado, setResultado] = useState<EstadoInscripcion | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [pendiente, startTransition] = useTransition();
    const fecha = fechaLarga(prueba.fechaInicio) === fechaLarga(prueba.fechaFin)
        ? fechaLarga(prueba.fechaInicio)
        : `${fechaLarga(prueba.fechaInicio)} – ${fechaLarga(prueba.fechaFin)}`;

    if (propia) return <section className="card space-y-4 p-6"><h1 className="text-xl font-semibold">Ya estás inscrito en {prueba.nombre}</h1><p className="text-sm">{ETIQUETAS_CATEGORIA[propia.categoria]} · {ETIQUETAS_ESTADO_INSCRIPCION[propia.estado]}</p><Link href="/cuenta/inscripciones" className="inline-block text-sm underline">Ver mis inscripciones</Link></section>;
    if (prueba.estado !== "abierta") return <section className="card space-y-2 p-6"><h1 className="text-xl font-semibold">{prueba.nombre}</h1><p className="text-sm text-muted">Las inscripciones de esta prueba no están abiertas.</p></section>;
    if (categorias.length === 0) return <section className="card space-y-2 p-6"><h1 className="text-xl font-semibold">{prueba.nombre}</h1><p className="text-sm text-muted">No hay categorías disponibles para ti en esta prueba.</p></section>;

    function confirmar() {
        if (!categoria) return;
        setError(null);
        startTransition(async () => {
            const res = await crearInscripcion({ pruebaId: prueba.id, categoria });
            if (res.ok) setResultado((res.estado as EstadoInscripcion) ?? "pendiente");
            else setError(res.error);
        });
    }

    return <section className="space-y-5" aria-live="polite">
        {resultado ? <div className="card space-y-4 p-6 md:p-8">
            <span className="inline-flex rounded-full bg-sage/20 px-3 py-1 text-sm font-semibold text-navy">Inscripción enviada</span>
            <h2 className="text-2xl font-semibold">{resultado === "lista_espera" ? "Estás en lista de espera" : "Inscripción registrada"}</h2>
            <p className="text-muted">{resultado === "lista_espera" ? "La prueba está completa. Te avisaremos si se libera una plaza." : "El organizador revisará y confirmará tu inscripción."}</p>
            <div className="flex flex-wrap gap-3 pt-2">
                <Link href="/cuenta/inscripciones" className="btn btn-primario">Ver mis inscripciones</Link>
                <Link href={`/buscar-pareja?prueba=${prueba.slug}`} className="btn btn-fantasma">Buscar pareja</Link>
            </div>
        </div> : <>
            <header className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-wider text-coral">Inscripción</p>
                <h1 className="text-2xl font-semibold">{prueba.nombre}</h1>
                <p className="text-sm text-muted">Elige categoría y confirma tu plaza.</p>
            </header>
            <div className="card grid gap-3 p-5 sm:grid-cols-3" aria-label="Resumen de la prueba">
                <div><p className="text-xs font-semibold uppercase tracking-wide text-muted">Fecha</p><p className="mt-1 font-medium">{fecha}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-wide text-muted">Sede</p><p className="mt-1 font-medium">{prueba.sede}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-wide text-muted">Precio por pareja</p><p className="mt-1 font-medium">{euros(prueba.precioCentimos)}</p></div>
            </div>
            <div className="card space-y-5 p-5 md:p-6">
                <fieldset className="space-y-3">
                    <legend className="mb-2 text-base font-semibold">Selecciona tu categoría</legend>
                    {categorias.map((c) => <label key={c} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${categoria === c ? "border-coral bg-coral/10" : "border-border hover:border-navy/40"}`}>
                        <input type="radio" name="categoria" value={c} checked={categoria === c} onChange={() => setCategoria(c)} className="accent-[var(--color-coral)]" />
                        <span className="font-medium">{ETIQUETAS_CATEGORIA[c]}</span>
                    </label>)}
                </fieldset>
                <p className="text-sm text-muted">La categoría se disputa cuando alcanza al menos 3 parejas inscritas.</p>
                {plazasLibres === 0 && <Aviso tipo="aviso">La prueba está completa. Si confirmas, entrarás en la lista de espera.</Aviso>}
                <p className="rounded-lg bg-surface p-4 text-sm leading-relaxed">Se paga en el club el primer día del torneo. Tu compañero o compañera se une después desde el tablón de búsqueda de pareja.</p>
                <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed">
                    <input type="checkbox" checked={acepta} onChange={(event) => setAcepta(event.target.checked)} className="mt-1 accent-[var(--color-coral)]" />
                    <span>He leído la información y quiero confirmar mi inscripción en esta categoría.</span>
                </label>
                {error && <Aviso tipo="error">{error}</Aviso>}
                <button type="button" onClick={confirmar} disabled={!categoria || !acepta || pendiente} className="btn btn-primario w-full disabled:cursor-not-allowed disabled:opacity-50">
                    {pendiente ? "Confirmando…" : "Confirmar inscripción"}
                </button>
            </div>
        </>}
    </section>;
}
