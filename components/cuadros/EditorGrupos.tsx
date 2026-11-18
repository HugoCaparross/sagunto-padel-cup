"use client";

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
    guardarGrupos,
    rehacerCategoria,
    type DatosEditor,
} from "@/actions/cuadros";
import type { Categoria } from "@/lib/constantes";

type Props = {
    pruebaId: string;
    categoria: Categoria;
    datos: DatosEditor;
};

function ChipPareja({ id, children }: { id: string; children: ReactNode }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `grupo-pareja:${id}`,
        data: { inscripcionId: id },
    });
    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={`cursor-grab select-none rounded-md bg-white px-2 py-1 text-sm shadow-sm ring-1 ring-[#D5D9DC] ${isDragging ? "opacity-50" : ""
                }`}
        >
            {children}
        </div>
    );
}

function ZonaGrupo({ letra, children }: { letra: string; children: ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({
        id: `grupo:${letra}`,
        data: { letra },
    });
    return (
        <div
            ref={setNodeRef}
            className={`rounded-xl bg-white p-4 ring-1 ring-[#D5D9DC] ${isOver ? "ring-2 ring-[#F0443A]" : ""
                }`}
        >
            {children}
        </div>
    );
}

export default function EditorGrupos({ pruebaId, categoria, datos }: Props) {
    const letras = datos.grupos.map((g) => g.letra);
    const esperados = Object.fromEntries(
        datos.grupos.map((g) => [g.letra, g.filas.length])
    );

    const [asignacion, setAsignacion] = useState<Record<string, string>>(() => ({
        ...datos.contexto.grupoDe,
    }));
    const [enviando, setEnviando] = useState(false);
    const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(
        null
    );

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
    );

    const textoDe = useMemo(
        () => new Map(datos.inscripciones.map((i) => [i.inscripcionId, i.texto])),
        [datos.inscripciones]
    );

    const idsActivos = datos.inscripciones.map((i) => i.inscripcionId);

    const miembros = (letra: string) =>
        idsActivos.filter((id) => asignacion[id] === letra);

    const problemas = letras
        .map((l) => {
            const n = miembros(l).length;
            return n === esperados[l]
                ? null
                : `Grupo ${l}: ${n} parejas (deben ser ${esperados[l]})`;
        })
        .filter((x): x is string => x !== null);

    function alSoltar(e: DragEndEvent) {
        const id = (e.active.data.current as { inscripcionId?: string } | undefined)
            ?.inscripcionId;
        const letra = (e.over?.data.current as { letra?: string } | undefined)?.letra;
        if (!id || !letra) return;
        setAsignacion((a) => ({ ...a, [id]: letra }));
        setMensaje(null);
    }

    async function guardar() {
        setEnviando(true);
        setMensaje(null);
        const res = await guardarGrupos({
            pruebaId,
            categoria,
            grupos: letras.map((letra) => ({ letra, ids: miembros(letra) })),
        });
        setEnviando(false);

        if (res.ok) {
            setMensaje({
                tipo: "ok",
                texto: ["Grupos guardados.", ...res.avisos].join(" "),
            });
        } else {
            setMensaje({ tipo: "error", texto: res.error });
        }
    }

    async function repetirSorteo() {
        if (
            !window.confirm(
                "Se volverá a sortear la fase de grupos y se borrarán las llaves. ¿Continuar?"
            )
        ) {
            return;
        }
        setEnviando(true);
        setMensaje(null);
        const res = await rehacerCategoria({ pruebaId, categoria });
        setEnviando(false);

        if (res.ok) {
            setMensaje({
                tipo: "ok",
                texto: "Sorteo repetido. Recarga la página para ver los nuevos grupos.",
            });
        } else {
            setMensaje({ tipo: "error", texto: res.error });
        }
    }

    if (letras.length === 0) {
        return (
            <section className="rounded-xl bg-white p-4 ring-1 ring-[#D5D9DC]">
                <p className="text-sm text-[#68737D]">
                    Genera primero la fase de grupos para poder editarlos.
                </p>
            </section>
        );
    }

    return (
        <section className="space-y-4">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Grupos</h2>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={repetirSorteo}
                        disabled={enviando}
                        className="rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-[#D5D9DC] disabled:opacity-50"
                    >
                        Repetir sorteo de grupos
                    </button>
                    <button
                        type="button"
                        onClick={guardar}
                        disabled={enviando || problemas.length > 0}
                        className="rounded-lg bg-[#F0443A] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                    >
                        {enviando ? "Guardando…" : "Guardar grupos"}
                    </button>
                </div>
            </header>

            <DndContext sensors={sensors} onDragEnd={alSoltar}>
                <div className="grid gap-4 md:grid-cols-2">
                    {letras.map((letra) => (
                        <ZonaGrupo key={letra} letra={letra}>
                            <h3 className="mb-2 font-medium">
                                Grupo {letra}{" "}
                                <span className="text-xs text-[#68737D]">
                                    ({miembros(letra).length}/{esperados[letra]})
                                </span>
                            </h3>
                            <div className="flex flex-col gap-2">
                                {miembros(letra).map((id) => (
                                    <ChipPareja key={id} id={id}>
                                        {textoDe.get(id) ?? "Pareja"}
                                    </ChipPareja>
                                ))}
                            </div>
                        </ZonaGrupo>
                    ))}
                </div>
            </DndContext>

            {problemas.length > 0 && (
                <div className="rounded-lg bg-[#FFF4DE] p-3 text-sm text-[#B77912]">
                    {problemas.map((p) => (
                        <p key={p}>{p}</p>
                    ))}
                </div>
            )}

            {mensaje && (
                <div
                    className={`rounded-lg p-3 text-sm ${mensaje.tipo === "ok"
                            ? "bg-[#EAF6EF] text-[#16845B]"
                            : "bg-[#FDECEC] text-[#C73535]"
                        }`}
                >
                    {mensaje.texto}
                </div>
            )}
        </section>
    );
}