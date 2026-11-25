"use client";

import Boton from "@/components/ui/Boton";
import { useMemo, useState, type ReactNode } from "react";
import {
    DndContext,
    PointerSensor,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    guardarLlaves,
    sortearCuartos,
    type DatosEditor,
} from "@/actions/cuadros";
import { ETIQUETAS_CATEGORIA, type Categoria, type Cuadro } from "@/lib/constantes";
import {
    FASES_CUADRO as RONDAS,
    validarLlaves,
    type AutomaticoEntrada,
    type LadoEntrada,
    type PartidoEntrada,
    type FaseCuadro as Ronda,
} from "@/lib/cuadros/formatos";

type Arrastre =
    | { tipo: "pareja"; inscripcionId: string }
    | { tipo: "ganador" | "perdedor"; partidoId: string };

type Destino =
    | { tipo: "lado"; partidoId: string; lado: "a" | "b" }
    | { tipo: "automatico"; cuadro: Cuadro }
    | { tipo: "pendientes" };

const CUADROS_ORDEN: Cuadro[] = ["oro", "plata", "bronce"];
const NOMBRE_CUADRO: Record<Cuadro, string> = { oro: "Oro", plata: "Plata", bronce: "Bronce" };
const NOMBRE_RONDA: Record<Ronda, string> = {
    round_robin: "Todos contra todos",
    cuartos: "Cuartos",
    semifinal: "Semifinales",
    final: "Final",
};

function arrastreDe(l: LadoEntrada): Arrastre {
    return l.tipo === "pareja"
        ? { tipo: "pareja", inscripcionId: l.inscripcionId }
        : { tipo: l.tipo, partidoId: l.partidoId };
}

function quitaSi(l: LadoEntrada | null, ids: Set<string>): LadoEntrada | null {
    return l?.tipo === "pareja" && ids.has(l.inscripcionId) ? null : l;
}

function quitaPareja(l: LadoEntrada | null, inscripcionId: string): LadoEntrada | null {
    return quitaSi(l, new Set([inscripcionId]));
}

function quitaReferencia(l: LadoEntrada | null, partidoId: string): LadoEntrada | null {
    return l && l.tipo !== "pareja" && l.partidoId === partidoId ? null : l;
}

function Chip({
    id,
    arrastre,
    children,
}: {
    id: string;
    arrastre: Arrastre;
    children: ReactNode;
}) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id,
        data: arrastre,
    });
    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={`cursor-grab select-none rounded-md bg-white px-2 py-1 text-sm shadow-sm ring-1 ring-[var(--color-border)] ${isDragging ? "opacity-50" : ""
                }`}
        >
            {children}
        </div>
    );
}

function Zona({
    id,
    destino,
    className,
    children,
}: {
    id: string;
    destino: Destino;
    className?: string;
    children: ReactNode;
}) {
    const { setNodeRef, isOver } = useDroppable({ id, data: destino });
    return (
        <div
            ref={setNodeRef}
            className={`${className ?? ""} ${isOver ? "ring-2 ring-[var(--color-coral)]" : ""}`}
        >
            {children}
        </div>
    );
}

export default function EditorLlaves({
    pruebaId,
    categoria,
    datos,
}: {
    pruebaId: string;
    categoria: Categoria;
    datos: DatosEditor;
}) {
    const [partidos, setPartidos] = useState<PartidoEntrada[]>(datos.partidos);
    const [automaticos, setAutomaticos] = useState<AutomaticoEntrada[]>(datos.automaticos);
    const [enviando, setEnviando] = useState(false);
    const [sorteando, setSorteando] = useState(false);
    const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; lineas: string[] } | null>(
        null
    );

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
    );

    const textoDe = useMemo(
        () => new Map(datos.inscripciones.map((i) => [i.inscripcionId, i.texto])),
        [datos.inscripciones]
    );

    const incidencias = useMemo(
        () => validarLlaves(partidos, automaticos, datos.contexto),
        [partidos, automaticos, datos.contexto]
    );
    const errores = incidencias.filter((i) => i.nivel === "error");
    const avisos = incidencias.filter((i) => i.nivel === "aviso");

    const colocadas = useMemo(() => {
        const s = new Set<string>();
        for (const p of partidos) {
            for (const l of [p.a, p.b]) if (l?.tipo === "pareja") s.add(l.inscripcionId);
        }
        for (const a of automaticos) if (a.inscripcionId) s.add(a.inscripcionId);
        return s;
    }, [partidos, automaticos]);

    const pendientes = datos.inscripciones.filter((i) => !colocadas.has(i.inscripcionId));

    const hayCuartos = partidos.some((p) => p.cuadro === "oro" && p.ronda === "cuartos");
    const cuartosRellenos = partidos.some(
        (p) => p.cuadro === "oro" && p.ronda === "cuartos" && (p.a || p.b)
    );

    const numeroDe = (partidoId: string) =>
        partidos.findIndex((p) => p.id === partidoId) + 1;

    const etiqueta = (l: LadoEntrada): string => {
        if (l.tipo === "pareja") return textoDe.get(l.inscripcionId) ?? "Pareja";
        return `${l.tipo === "ganador" ? "Ganador" : "Perdedor"} de P${numeroDe(l.partidoId)}`;
    };

    function aplicar(arrastre: Arrastre, destino: Destino) {
        let ps = partidos;
        let as = automaticos;

        if (arrastre.tipo === "pareja") {
            const id = arrastre.inscripcionId;
            ps = ps.map((p) => ({
                ...p,
                a: quitaPareja(p.a, id),
                b: quitaPareja(p.b, id),
            }));
            as = as.map((a) => (a.inscripcionId === id ? { ...a, inscripcionId: null } : a));
        }

        if (destino.tipo === "automatico") {
            const valor = arrastre.tipo === "pareja" ? arrastre.inscripcionId : null;
            as = [
                ...as.filter((a) => a.cuadro !== destino.cuadro),
                { cuadro: destino.cuadro, inscripcionId: valor },
            ];
        } else if (destino.tipo === "lado") {
            const lado: LadoEntrada =
                arrastre.tipo === "pareja"
                    ? { tipo: "pareja", inscripcionId: arrastre.inscripcionId }
                    : { tipo: arrastre.tipo, partidoId: arrastre.partidoId };
            ps = ps.map((p) =>
                p.id === destino.partidoId ? { ...p, [destino.lado]: lado } : p
            );
        }

        setPartidos(ps);
        setAutomaticos(as);
        setMensaje(null);
    }

    function alSoltar(e: DragEndEvent) {
        const arrastre = e.active.data.current as Arrastre | undefined;
        const destino = e.over?.data.current as Destino | undefined;
        if (arrastre && destino) aplicar(arrastre, destino);
    }

    async function sugerirSorteoCuartos() {
        if (
            cuartosRellenos &&
            !window.confirm("Esto reemplaza las parejas de cuartos. ¿Continuar?")
        ) {
            return;
        }

        setSorteando(true);
        setMensaje(null);
        const res = await sortearCuartos({ pruebaId, categoria });
        setSorteando(false);

        if (!res.ok) {
            setMensaje({ tipo: "error", lineas: [res.error] });
            return;
        }

        const cuartos = partidos
            .filter((p) => p.cuadro === "oro" && p.ronda === "cuartos")
            .sort((x, y) => x.orden - y.orden);

        if (cuartos.length !== res.cruces.length) {
            setMensaje({ tipo: "error", lineas: ["La llave no tiene los cuartos de oro esperados"] });
            return;
        }

        const usadas = new Set(res.cruces.flat());

        setPartidos((ps) =>
            ps.map((p) => {
                const limpio = {
                    ...p,
                    a: quitaSi(p.a, usadas),
                    b: quitaSi(p.b, usadas),
                };
                const i = cuartos.findIndex((c) => c.id === p.id);
                if (i < 0) return limpio;
                const [x, y] = res.cruces[i];
                return {
                    ...limpio,
                    a: { tipo: "pareja", inscripcionId: x },
                    b: { tipo: "pareja", inscripcionId: y },
                };
            })
        );

        setAutomaticos((as) =>
            as.map((a) =>
                a.inscripcionId && usadas.has(a.inscripcionId) ? { ...a, inscripcionId: null } : a
            )
        );
    }

    function quitarLado(partidoId: string, lado: "a" | "b") {
        setPartidos((ps) => ps.map((p) => (p.id === partidoId ? { ...p, [lado]: null } : p)));
    }

    function quitarPartido(id: string) {
        setPartidos((ps) =>
            ps
                .filter((p) => p.id !== id)
                .map((p) => ({
                    ...p,
                    a: quitaReferencia(p.a, id),
                    b: quitaReferencia(p.b, id),
                }))
        );
    }

    function anadirPartido(cuadro: Cuadro, ronda: Ronda) {
        setPartidos((ps) => [
            ...ps,
            {
                id: `n-${crypto.randomUUID()}`,
                cuadro,
                ronda,
                formato: cuadro === "oro" && ronda === "final" ? "final" : "fase_final",
                orden: ps.length,
                a: null,
                b: null,
            },
        ]);
    }

    function cambiarPartido(id: string, cambios: Partial<Pick<PartidoEntrada, "cuadro" | "ronda" | "formato">>) {
        setPartidos((ps) => ps.map((p) => (p.id === id ? { ...p, ...cambios } : p)));
    }

    function moverPartido(id: string, dir: -1 | 1) {
        setPartidos((ps) => {
            const idx = ps.findIndex((p) => p.id === id);
            if (idx < 0) return ps;
            const actual = ps[idx];

            const hermanos = ps
                .map((p, i) => ({ p, i }))
                .filter(({ p }) => p.cuadro === actual.cuadro && p.ronda === actual.ronda);
            const pos = hermanos.findIndex(({ p }) => p.id === id);
            const destino = hermanos[pos + dir];
            if (!destino) return ps;

            const copia = [...ps];
            [copia[idx], copia[destino.i]] = [copia[destino.i], copia[idx]];
            return copia;
        });
    }

    function reemplazarAutomatico(cuadro: Cuadro, inscripcionId: string | null) {
        setAutomaticos((as) => [
            ...as.filter((a) => a.cuadro !== cuadro),
            { cuadro, inscripcionId },
        ]);
    }

    async function guardar() {
        let motivo: string | undefined;
        if (datos.bloqueado) {
            const m = window.prompt(
                "Hay resultados registrados. Indica el motivo para rehacer las llaves (mínimo 10 caracteres):"
            );
            if (!m) return;
            motivo = m;
        }

        setEnviando(true);
        setMensaje(null);

        const res = await guardarLlaves({
            pruebaId,
            categoria,
            partidos: partidos.map((p, i) => ({ ...p, orden: i })),
            automaticos: automaticos.map((a) => ({ cuadro: a.cuadro, inscripcionId: a.inscripcionId })),
            motivo,
        });

        setEnviando(false);

        if (res.ok) {
            setMensaje({ tipo: "ok", lineas: ["Llaves guardadas.", ...res.avisos] });
        } else {
            setMensaje({
                tipo: "error",
                lineas: [res.error, ...(res.incidencias ?? []).map((i) => i.mensaje)],
            });
        }
    }

    const ladoUI = (p: PartidoEntrada, lado: "a" | "b") => {
        const valor = p[lado];
        return (
            <Zona
                id={`dest:${p.id}:${lado}`}
                destino={{ tipo: "lado", partidoId: p.id, lado }}
                className="flex min-h-9 items-center justify-between gap-2 rounded-md border border-dashed border-[var(--color-border)] bg-white px-2 py-1 text-sm"
            >
                {valor ? (
                    <>
                        <Chip id={`lado:${p.id}:${lado}`} arrastre={arrastreDe(valor)}>
                            {etiqueta(valor)}
                        </Chip>
                        <button
                            type="button"
                            onClick={() => quitarLado(p.id, lado)}
                            className="text-xs text-[var(--color-muted)]"
                            aria-label="Quitar"
                        >
                            ×
                        </button>
                    </>
                ) : (
                    <span className="text-[var(--color-muted)]">Arrastra aquí</span>
                )}
            </Zona>
        );
    };

    const renderCuadro = (c: Cuadro) => {
        const auto = automaticos.find((a) => a.cuadro === c);

        return (
            <section key={c} className="rounded-xl bg-white p-4 ring-1 ring-[var(--color-border)]">
                <h2 className="mb-3 text-lg font-semibold">{NOMBRE_CUADRO[c]}</h2>

                <Zona
                    id={`auto:${c}`}
                    destino={{ tipo: "automatico", cuadro: c }}
                    className="mb-4 rounded-md border border-dashed border-[var(--color-border)] p-2"
                >
                    <div className="mb-1 flex items-center justify-between text-xs text-[var(--color-muted)]">
                        <span>Campeón automático (sin partido)</span>
                        {auto?.inscripcionId && (
                            <button
                                type="button"
                                onClick={() => reemplazarAutomatico(c, null)}
                                className="text-[var(--color-danger)]"
                            >
                                Quitar
                            </button>
                        )}
                    </div>
                    {auto?.inscripcionId ? (
                        <Chip
                            id={`auto:${c}:chip`}
                            arrastre={{ tipo: "pareja", inscripcionId: auto.inscripcionId }}
                        >
                            {textoDe.get(auto.inscripcionId) ?? "Pareja"}
                        </Chip>
                    ) : (
                        <span className="text-sm text-[var(--color-muted)]">Arrastra una pareja aquí</span>
                    )}
                </Zona>

                {RONDAS.map((r) => {
                    const lista = partidos.filter((p) => p.cuadro === c && p.ronda === r);
                    if (lista.length === 0) return null;

                    return (
                        <div key={r} className="mb-4">
                            <div className="mb-2 flex items-center justify-between">
                                <p className="text-sm font-medium">{NOMBRE_RONDA[r]}</p>
                                <button
                                    type="button"
                                    onClick={() => anadirPartido(c, r)}
                                    className="text-xs font-medium text-[var(--color-coral)]"
                                >
                                    + partido
                                </button>
                            </div>

                            <div className="space-y-2">
                                {lista.map((p) => (
                                    <div key={p.id} className="rounded-lg bg-[var(--color-surface)] p-2">
                                        <div className="mb-2 flex flex-wrap items-center gap-1 text-xs">
                                            <span className="mr-1 font-medium text-[var(--color-muted)]">P{numeroDe(p.id)}</span>

                                            <select
                                                value={p.cuadro}
                                                onChange={(e) =>
                                                    cambiarPartido(p.id, { cuadro: e.target.value as Cuadro })
                                                }
                                                className="rounded border border-[var(--color-border)] bg-white px-1 py-0.5"
                                                aria-label="Cuadro"
                                            >
                                                {CUADROS_ORDEN.map((x) => (
                                                    <option key={x} value={x}>
                                                        {NOMBRE_CUADRO[x]}
                                                    </option>
                                                ))}
                                            </select>

                                            <select
                                                value={p.ronda}
                                                onChange={(e) =>
                                                    cambiarPartido(p.id, { ronda: e.target.value as Ronda })
                                                }
                                                className="rounded border border-[var(--color-border)] bg-white px-1 py-0.5"
                                                aria-label="Ronda"
                                            >
                                                {RONDAS.map((x) => (
                                                    <option key={x} value={x}>
                                                        {NOMBRE_RONDA[x]}
                                                    </option>
                                                ))}
                                            </select>

                                            <select
                                                value={p.formato}
                                                onChange={(e) =>
                                                    cambiarPartido(p.id, {
                                                        formato: e.target.value as "fase_final" | "final",
                                                    })
                                                }
                                                className="rounded border border-[var(--color-border)] bg-white px-1 py-0.5"
                                                aria-label="Formato"
                                            >
                                                <option value="fase_final">1 set · 9 juegos</option>
                                                <option value="final">2 sets</option>
                                            </select>

                                            <button
                                                type="button"
                                                onClick={() => moverPartido(p.id, -1)}
                                                className="rounded px-1 text-[var(--color-muted)] hover:bg-white"
                                                aria-label="Subir"
                                            >
                                                ↑
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => moverPartido(p.id, 1)}
                                                className="rounded px-1 text-[var(--color-muted)] hover:bg-white"
                                                aria-label="Bajar"
                                            >
                                                ↓
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => quitarPartido(p.id)}
                                                className="ml-auto text-[var(--color-danger)]"
                                            >
                                                Eliminar
                                            </button>
                                        </div>

                                        <div className="space-y-1">
                                            {ladoUI(p, "a")}
                                            {ladoUI(p, "b")}
                                        </div>

                                        <div className="mt-2 flex gap-2">
                                            <Chip
                                                id={`ref:${p.id}:ganador`}
                                                arrastre={{ tipo: "ganador", partidoId: p.id }}
                                            >
                                                Ganador P{numeroDe(p.id)}
                                            </Chip>
                                            <Chip
                                                id={`ref:${p.id}:perdedor`}
                                                arrastre={{ tipo: "perdedor", partidoId: p.id }}
                                            >
                                                Perdedor P{numeroDe(p.id)}
                                            </Chip>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </section>
        );
    };

    return (
        <DndContext sensors={sensors} onDragEnd={alSoltar}>
            <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold">
                        Llaves · {ETIQUETAS_CATEGORIA[categoria]}
                    </h1>
                    <p className="text-sm text-[var(--color-muted)]">
                        {datos.parejas} parejas
                        {datos.sugerida ? " · plantilla sugerida, sin guardar" : ""}
                        {datos.bloqueado ? " · hay resultados registrados" : ""}
                    </p>
                </div>

                {hayCuartos && (
                    <button
                        type="button"
                        onClick={sugerirSorteoCuartos}
                        disabled={sorteando}
                        className="rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-[var(--color-border)] disabled:opacity-50"
                    >
                        {sorteando
                            ? "Sorteando…"
                            : cuartosRellenos
                                ? "Repetir sorteo de cuartos"
                                : "Sugerir sorteo de cuartos"}
                    </button>
                )}
            </header>

            <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
                <aside className="space-y-4">
                    <section className="rounded-xl bg-white p-4 ring-1 ring-[var(--color-border)]">
                        <h3 className="mb-2 font-semibold">Clasificación de grupos</h3>
                        {datos.grupos.map((g) => (
                            <div key={g.letra} className="mb-3">
                                <p className="text-xs uppercase text-[var(--color-muted)]">
                                    Grupo {g.letra} {g.completo ? "" : "· provisional"}
                                </p>
                                <ol className="text-sm">
                                    {g.filas.map((f) => (
                                        <li key={f.id}>
                                            {f.posicion}.º {textoDe.get(f.id)}
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        ))}
                    </section>

                    <Zona
                        id="pendientes"
                        destino={{ tipo: "pendientes" }}
                        className="min-h-24 rounded-xl bg-white p-4 ring-1 ring-[var(--color-border)]"
                    >
                        <h3 className="mb-2 font-semibold">Sin colocar ({pendientes.length})</h3>
                        <div className="flex flex-col gap-2">
                            {pendientes.map((i) => (
                                <Chip
                                    key={i.inscripcionId}
                                    id={`pareja:${i.inscripcionId}`}
                                    arrastre={{ tipo: "pareja", inscripcionId: i.inscripcionId }}
                                >
                                    {i.texto}
                                </Chip>
                            ))}
                        </div>
                    </Zona>

                    <section className="rounded-xl bg-white p-4 text-sm ring-1 ring-[var(--color-border)]">
                        <h3 className="mb-2 font-semibold">Validación</h3>
                        {errores.length === 0 && avisos.length === 0 && (
                            <p className="text-[var(--color-success)]">Sin incidencias.</p>
                        )}
                        {errores.map((i, n) => (
                            <p key={`e${n}`} className="mb-1 text-[var(--color-danger)]">
                                {i.mensaje}
                            </p>
                        ))}
                        {avisos.map((i, n) => (
                            <p key={`a${n}`} className="mb-1 text-[var(--color-warning)]">
                                {i.mensaje}
                            </p>
                        ))}
                    </section>

                    <Boton variante="primario" tamano="md"
                        type="button"
                        onClick={guardar}
                        disabled={enviando || errores.length > 0}
                        className="w-full disabled:opacity-50"
                    >
                        {enviando ? "Guardando…" : "Guardar llaves"}
                    </Boton>

                    {mensaje && (
                        <div
                            className={`rounded-lg p-3 text-sm ${mensaje.tipo === "ok"
                                    ? "bg-[var(--color-success-bg)] text-[var(--color-success)]"
                                    : "bg-[var(--color-danger-bg)] text-[var(--color-danger)]"
                                }`}
                        >
                            {mensaje.lineas.map((l, n) => (
                                <p key={n}>{l}</p>
                            ))}
                        </div>
                    )}
                </aside>

                <div className="grid gap-6 xl:grid-cols-3">
                    {CUADROS_ORDEN.map((c) => renderCuadro(c))}
                </div>
            </div>
        </DndContext>
    );
}
