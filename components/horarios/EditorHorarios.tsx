"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
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
    configurarPrueba,
    guardarHorarios,
    planificarHorarios,
    type DatosHorarios,
    type FilaHorario,
} from "@/actions/horarios";
import {
    buscarHueco,
    construirOcupacion,
    detectarConflictos,
    type Colocado,
    type PartidoPlan,
    type Ventana,
} from "@/lib/horarios/planificador";
import { aHora, aMinutos, diasEntre } from "@/lib/horarios/tiempo";

type Parcial = {
    pistaId: string | null;
    fecha: string | null;
    inicioMin: number | null;
    duracionMin: number;
};

type Aviso = { tipo: "ok" | "error"; texto: string } | null;

function etiquetaDe(f: FilaHorario): string {
    return `${f.categoria} · ${f.cuadro ?? "grupo"} · ${f.textoA} vs ${f.textoB}`;
}

function Arrastre({
    partidoId,
    soloMango = false,
    className,
    children,
}: {
    partidoId: string;
    soloMango?: boolean;
    className?: string;
    children?: ReactNode;
}) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `h:${partidoId}`,
        data: { partidoId },
    });

    if (soloMango) {
        return (
            <span
                ref={setNodeRef}
                {...listeners}
                {...attributes}
                className="cursor-grab select-none px-1 text-[#68737D]"
                aria-label="Arrastrar partido"
            >
                ⠿
            </span>
        );
    }

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={`cursor-grab select-none ${isDragging ? "opacity-50" : ""} ${className ?? ""}`}
        >
            {children}
        </div>
    );
}

function Columna({
    id,
    data,
    titulo,
    subtitulo,
    children,
}: {
    id: string;
    data: { pistaId?: string };
    titulo: string;
    subtitulo?: string;
    children: ReactNode;
}) {
    const { setNodeRef, isOver } = useDroppable({ id, data });
    return (
        <section
            ref={setNodeRef}
            className={`flex w-72 shrink-0 flex-col rounded-xl bg-white p-3 ring-1 ring-[#D5D9DC] ${isOver ? "ring-2 ring-[#F0443A]" : ""
                }`}
        >
            <header className="mb-2">
                <h3 className="font-semibold">{titulo}</h3>
                {subtitulo && <p className="text-xs text-[#68737D]">{subtitulo}</p>}
            </header>
            <div className="flex flex-col gap-2">{children}</div>
        </section>
    );
}

function Campo({
    nombre,
    etiqueta,
    defecto,
}: {
    nombre: string;
    etiqueta: string;
    defecto: number;
}) {
    return (
        <label className="flex flex-col gap-1 text-sm">
            <span className="text-[#68737D]">{etiqueta}</span>
            <input
                name={nombre}
                type="number"
                min={1}
                defaultValue={defecto}
                className="rounded-md border border-[#D5D9DC] bg-white px-2 py-1"
            />
        </label>
    );
}

export default function EditorHorarios({
    pruebaId,
    datos,
}: {
    pruebaId: string;
    datos: DatosHorarios;
}) {
    const dias = useMemo(
        () => diasEntre(datos.prueba.fechaInicio, datos.prueba.fechaFin),
        [datos.prueba.fechaInicio, datos.prueba.fechaFin]
    );

    const [dia, setDia] = useState<string>(dias[0] ?? "");
    const [incluirElim, setIncluirElim] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [aviso, setAviso] = useState<Aviso>(null);

    const [asig, setAsig] = useState<Record<string, Parcial>>(() =>
        Object.fromEntries(
            datos.partidos.map((p) => [
                p.id,
                {
                    pistaId: p.pistaId,
                    fecha: p.fecha,
                    inicioMin: p.inicioMin,
                    duracionMin: p.duracionMin,
                },
            ])
        )
    );

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
    );

    const descanso = datos.prueba.descansoMin;
    const horaIni = aMinutos(datos.prueba.horaInicio);
    const horaFin = aMinutos(datos.prueba.horaFin);

    const ventanas: Ventana[] = useMemo(
        () => dias.map((fecha) => ({ fecha, inicioMin: horaIni, finMin: horaFin })),
        [dias, horaIni, horaFin]
    );

    const ventanaDia: Ventana = { fecha: dia, inicioMin: horaIni, finMin: horaFin };

    const filasPorId = useMemo(
        () => new Map(datos.partidos.map((f) => [f.id, f])),
        [datos.partidos]
    );

    const colocadoDe = (f: FilaHorario): Colocado | null => {
        const a = asig[f.id];
        if (!a || !a.pistaId || !a.fecha || a.inicioMin === null) return null;
        return {
            partidoId: f.id,
            pistaId: a.pistaId,
            fecha: a.fecha,
            inicioMin: a.inicioMin,
            duracionMin: a.duracionMin,
            jugadores: f.jugadores,
            dependeDe: f.dependeDe,
        };
    };

    const colocados = datos.partidos
        .map(colocadoDe)
        .filter((c): c is Colocado => c !== null);

    const conflictos = detectarConflictos(colocados, descanso);

    const etiquetaPorId = (id: string) => {
        const f = filasPorId.get(id);
        return f ? etiquetaDe(f) : "Partido";
    };

    const sinHorario = datos.partidos
        .filter((f) => !asig[f.id]?.pistaId)
        .sort((a, b) => a.orden - b.orden);

    const porPista = (pistaId: string) =>
        datos.partidos
            .filter((f) => asig[f.id]?.pistaId === pistaId)
            .sort((a, b) => {
                const x = asig[a.id];
                const y = asig[b.id];
                return (
                    (x.fecha ?? "").localeCompare(y.fecha ?? "") ||
                    (x.inicioMin ?? 0) - (y.inicioMin ?? 0)
                );
            });

    const planPartido = (f: FilaHorario, duracionMin: number): PartidoPlan => ({
        id: f.id,
        categoria: f.categoria,
        ronda: f.ronda,
        duracionMin,
        jugadores: f.jugadores,
        dependeDe: f.dependeDe,
    });

    function cambiar(id: string, cambios: Partial<Parcial>) {
        setAsig((a) => ({ ...a, [id]: { ...a[id], ...cambios } }));
    }

    function quitar(id: string) {
        cambiar(id, { pistaId: null, fecha: null, inicioMin: null });
    }

    function alSoltar(e: DragEndEvent) {
        const partidoId = (e.active.data.current as { partidoId?: string } | undefined)
            ?.partidoId;
        if (!partidoId || !e.over) return;

        const fila = filasPorId.get(partidoId);
        if (!fila) return;

        const destino = e.over.data.current as { pistaId?: string } | undefined;

        if (!destino?.pistaId) {
            quitar(partidoId);
            return;
        }

        const pista = datos.pistas.find((p) => p.id === destino.pistaId);
        if (!pista) return;

        const otros = colocados.filter((c) => c.partidoId !== partidoId);
        const ocup = construirOcupacion(otros, descanso);

        if (fila.dependeDe.some((d) => !ocup.finPartido.has(d))) {
            setAviso({
                tipo: "error",
                texto: "Este partido depende de otro que aún no tiene horario",
            });
            return;
        }

        const minimoAbs = Math.max(
            Number.NEGATIVE_INFINITY,
            ...fila.dependeDe.map((d) => (ocup.finPartido.get(d) ?? 0) + descanso)
        );

        const hueco = buscarHueco({
            partido: planPartido(fila, asig[partidoId].duracionMin),
            ventanas: [ventanaDia],
            pistas: [pista],
            ocup,
            descansoMin: descanso,
            minimoAbs,
            pistaFija: pista.id,
        });

        if (!hueco) {
            setAviso({
                tipo: "error",
                texto: `No hay hueco en la pista ${pista.numero} el ${dia} con esa duración`,
            });
            return;
        }

        cambiar(partidoId, {
            pistaId: pista.id,
            fecha: hueco.fecha,
            inicioMin: hueco.inicioMin,
        });
        setAviso(null);
    }

    async function planificar() {
        setEnviando(true);
        setAviso(null);
        const res = await planificarHorarios({
            pruebaId,
            incluirEliminatorias: incluirElim,
        });
        setEnviando(false);

        if (!res.ok) {
            setAviso({ tipo: "error", texto: res.error });
            return;
        }

        setAsig((a) => {
            const copia = { ...a };
            for (const s of res.asignaciones) {
                copia[s.partidoId] = {
                    pistaId: s.pistaId,
                    fecha: s.fecha,
                    inicioMin: s.inicioMin,
                    duracionMin: s.finMin - s.inicioMin,
                };
            }
            return copia;
        });

        setAviso(
            res.sinAsignar.length > 0
                ? {
                    tipo: "error",
                    texto: `${res.sinAsignar.length} partido(s) sin horario: ${res.sinAsignar[0].motivo}`,
                }
                : { tipo: "ok", texto: "Propuesta aplicada. Revísala y guarda." }
        );
    }

    async function guardar() {
        setEnviando(true);
        setAviso(null);
        const res = await guardarHorarios({
            pruebaId,
            asignaciones: datos.partidos.map((f) => {
                const a = asig[f.id];
                return {
                    partidoId: f.id,
                    pistaId: a.pistaId,
                    fecha: a.fecha,
                    inicioMin: a.inicioMin,
                    duracionMin: a.duracionMin,
                };
            }),
        });
        setEnviando(false);

        if (res.ok) {
            window.location.reload();
        } else {
            setAviso({ tipo: "error", texto: res.error });
        }
    }

    async function guardarConfig(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setEnviando(true);
        setAviso(null);

        const res = await configurarPrueba({
            pruebaId,
            pistas: Number(f.get("pistas")),
            plazasMaximas: Number(f.get("plazas")),
            descansoMin: Number(f.get("descanso")),
            duracionGrupoMin: Number(f.get("grupo")),
            duracionFaseFinalMin: Number(f.get("fase")),
            duracionFinalMin: Number(f.get("final")),
        });

        setEnviando(false);
        if (res.ok) {
            window.location.reload();
        } else {
            setAviso({ tipo: "error", texto: res.error });
        }
    }

    const bloqueoGuardar = enviando || conflictos.length > 0;

    return (
        <DndContext sensors={sensors} onDragEnd={alSoltar}>
            <div className="space-y-6">
                <header className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold">Horarios y pistas</h1>
                        <p className="text-sm text-[#68737D]">
                            {datos.partidos.length} partidos · {datos.pistas.length} pistas · descanso{" "}
                            {descanso} min
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={incluirElim}
                                onChange={(e) => setIncluirElim(e.target.checked)}
                            />
                            Incluir eliminatorias
                        </label>
                        <button
                            type="button"
                            onClick={planificar}
                            disabled={enviando}
                            className="rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-[#D5D9DC] disabled:opacity-50"
                        >
                            Proponer horarios
                        </button>
                        <button
                            type="button"
                            onClick={guardar}
                            disabled={bloqueoGuardar}
                            className="rounded-lg bg-[#F0443A] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                        >
                            {enviando ? "Guardando…" : "Guardar horarios"}
                        </button>
                    </div>
                </header>

                <details className="rounded-xl bg-white p-4 ring-1 ring-[#D5D9DC]">
                    <summary className="cursor-pointer font-semibold">
                        Configuración de la prueba
                    </summary>
                    <form onSubmit={guardarConfig} className="mt-4 space-y-4">
                        <div className="grid gap-3 sm:grid-cols-3">
                            <Campo nombre="pistas" etiqueta="Pistas" defecto={datos.pistas.length} />
                            <Campo nombre="plazas" etiqueta="Parejas máximas" defecto={datos.prueba.plazasMaximas} />
                            <Campo nombre="descanso" etiqueta="Descanso (min)" defecto={descanso} />
                            <Campo nombre="grupo" etiqueta="Duración grupo (min)" defecto={datos.prueba.duracion.grupo} />
                            <Campo nombre="fase" etiqueta="Duración fase final (min)" defecto={datos.prueba.duracion.fase_final} />
                            <Campo nombre="final" etiqueta="Duración final (min)" defecto={datos.prueba.duracion.final} />
                        </div>
                        <button
                            type="submit"
                            disabled={enviando}
                            className="rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-[#D5D9DC] disabled:opacity-50"
                        >
                            Guardar configuración
                        </button>
                    </form>
                </details>

                <div className="flex flex-wrap gap-2">
                    {dias.map((d) => (
                        <button
                            key={d}
                            type="button"
                            onClick={() => setDia(d)}
                            className={`rounded-md px-3 py-1 text-sm ${d === dia ? "bg-[#0D1B2A] text-white" : "bg-white ring-1 ring-[#D5D9DC]"
                                }`}
                        >
                            {d}
                        </button>
                    ))}
                </div>

                {aviso && (
                    <div
                        className={`rounded-lg p-3 text-sm ${aviso.tipo === "ok"
                                ? "bg-[#EAF6EF] text-[#16845B]"
                                : "bg-[#FDECEC] text-[#C73535]"
                            }`}
                    >
                        {aviso.texto}
                    </div>
                )}

                {conflictos.length > 0 && (
                    <div className="rounded-lg bg-[#FDECEC] p-3 text-sm text-[#C73535]">
                        {conflictos.map((c, i) => (
                            <p key={i}>
                                {c.mensaje}: {c.partidoIds.map(etiquetaPorId).join(" · ")}
                            </p>
                        ))}
                    </div>
                )}

                <div className="flex gap-4 overflow-x-auto pb-4">
                    <Columna
                        id="sin-horario"
                        data={{}}
                        titulo="Sin horario"
                        subtitulo={`${sinHorario.length} partido(s)`}
                    >
                        {sinHorario.map((f) => (
                            <Arrastre
                                key={f.id}
                                partidoId={f.id}
                                className="rounded-lg bg-[#F4F5F4] p-2 text-xs ring-1 ring-[#D5D9DC]"
                            >
                                <p className="font-medium">{etiquetaDe(f)}</p>
                                <p className="text-[#68737D]">{f.duracionMin} min</p>
                            </Arrastre>
                        ))}
                    </Columna>

                    {datos.pistas.map((p) => {
                        const lista = porPista(p.id);
                        return (
                            <Columna
                                key={p.id}
                                id={`pista:${p.id}`}
                                data={{ pistaId: p.id }}
                                titulo={`Pista ${p.numero}`}
                                subtitulo={`${lista.length} partido(s) · arrastra aquí para ${dia}`}
                            >
                                {lista.map((f) => {
                                    const a = asig[f.id];
                                    return (
                                        <div
                                            key={f.id}
                                            className="rounded-lg bg-[#F4F5F4] p-2 text-xs ring-1 ring-[#D5D9DC]"
                                        >
                                            <div className="mb-1 flex items-center justify-between gap-2">
                                                <Arrastre partidoId={f.id} soloMango />
                                                <span className="flex-1 truncate text-[#68737D]">
                                                    {f.categoria} · {f.cuadro ?? "grupo"}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => quitar(f.id)}
                                                    className="text-[#C73535]"
                                                    aria-label="Quitar horario"
                                                >
                                                    ×
                                                </button>
                                            </div>

                                            <p className="mb-2">
                                                {f.textoA} vs {f.textoB}
                                            </p>

                                            <div className="flex flex-wrap items-center gap-2">
                                                <input
                                                    type="date"
                                                    value={a.fecha ?? ""}
                                                    onChange={(e) => cambiar(f.id, { fecha: e.target.value })}
                                                    className="rounded border border-[#D5D9DC] bg-white px-1 py-0.5"
                                                    aria-label="Fecha"
                                                />
                                                <input
                                                    type="time"
                                                    value={a.inicioMin !== null ? aHora(a.inicioMin) : ""}
                                                    onChange={(e) =>
                                                        cambiar(f.id, { inicioMin: aMinutos(e.target.value) })
                                                    }
                                                    className="rounded border border-[#D5D9DC] bg-white px-1 py-0.5"
                                                    aria-label="Hora"
                                                />
                                                <input
                                                    type="number"
                                                    min={5}
                                                    step={5}
                                                    value={a.duracionMin}
                                                    onChange={(e) =>
                                                        cambiar(f.id, { duracionMin: Number(e.target.value) })
                                                    }
                                                    className="w-16 rounded border border-[#D5D9DC] bg-white px-1 py-0.5"
                                                    aria-label="Duración en minutos"
                                                />
                                                <span className="text-[#68737D]">min</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </Columna>
                        );
                    })}
                </div>
            </div>
        </DndContext>
    );
}