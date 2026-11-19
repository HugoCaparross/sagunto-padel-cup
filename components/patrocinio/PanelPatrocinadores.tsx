"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
    asignarPatrocinador,
    cambiarActivoPatrocinador,
    guardarPatrocinador,
} from "@/actions/patrocinio";
import type { PatrocinadorAdmin } from "@/lib/patrocinio/admin";

type Props = {
    pruebaId: string;
    patrocinadores: PatrocinadorAdmin[];
    asignadas: string[];
};

type Resultado = { ok: true } | { ok: false; error: string };

const CAMPO = "rounded-md border border-[#D5D9DC] bg-white px-2 py-1.5 text-sm";

export default function PanelPatrocinadores({ pruebaId, patrocinadores, asignadas }: Props) {
    const router = useRouter();
    const [pendiente, startTransition] = useTransition();
    const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
    // null = sin formulario; "nuevo" = alta; objeto = edición
    const [editando, setEditando] = useState<PatrocinadorAdmin | "nuevo" | null>(null);

    const asignadasSet = new Set(asignadas);
    const valor = editando && editando !== "nuevo" ? editando : null;

    function ejecutar(fn: () => Promise<Resultado>, okTexto: string) {
        setMensaje(null);
        startTransition(async () => {
            const r = await fn();
            if (r.ok) {
                setMensaje({ tipo: "ok", texto: okTexto });
                setEditando(null);
                router.refresh();
            } else {
                setMensaje({ tipo: "error", texto: r.error });
            }
        });
    }

    function guardar(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const webUrl = String(f.get("webUrl") ?? "").trim();

        ejecutar(
            () =>
                guardarPatrocinador({
                    id: valor?.id,
                    nombre: String(f.get("nombre") ?? ""),
                    logoUrl: String(f.get("logoUrl") ?? ""),
                    webUrl: webUrl || null,
                    tipo: String(f.get("tipo") ?? "comercial"),
                }),
            "Patrocinador guardado"
        );
    }

    return (
        <section className="space-y-4">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="font-semibold">Patrocinadores</h2>
                    <p className="text-xs text-[#68737D]">
                        Los inactivos no se muestran en la web. Asígnalos a la prueba con la casilla.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setEditando("nuevo")}
                    className="rounded-lg bg-[#F0443A] px-3 py-2 text-sm font-medium text-white"
                >
                    Nuevo patrocinador
                </button>
            </header>

            {editando !== null && (
                <form
                    key={valor?.id ?? "nuevo"}
                    onSubmit={guardar}
                    className="grid gap-3 rounded-xl bg-white p-4 text-sm ring-1 ring-[#D5D9DC] md:grid-cols-2"
                >
                    <label className="flex flex-col gap-1">
                        <span className="text-[#68737D]">Nombre</span>
                        <input name="nombre" defaultValue={valor?.nombre ?? ""} required minLength={2} maxLength={120} className={CAMPO} />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-[#68737D]">Tipo</span>
                        <select name="tipo" defaultValue={valor?.tipo ?? "comercial"} className={CAMPO}>
                            <option value="institucional">Institucional</option>
                            <option value="comercial">Comercial</option>
                        </select>
                    </label>
                    <label className="flex flex-col gap-1 md:col-span-2">
                        <span className="text-[#68737D]">URL del logo</span>
                        <input name="logoUrl" type="url" defaultValue={valor?.logoUrl ?? ""} required maxLength={500} className={CAMPO} />
                    </label>
                    <label className="flex flex-col gap-1 md:col-span-2">
                        <span className="text-[#68737D]">Web (opcional)</span>
                        <input name="webUrl" type="url" defaultValue={valor?.webUrl ?? ""} maxLength={500} className={CAMPO} />
                    </label>
                    <div className="flex gap-2 md:col-span-2">
                        <button type="submit" disabled={pendiente} className="rounded-lg bg-[#0D1B2A] px-3 py-2 text-white disabled:opacity-50">
                            Guardar
                        </button>
                        <button type="button" onClick={() => setEditando(null)} className="text-[#68737D] underline">
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            {mensaje && (
                <p className={`rounded-lg p-3 text-sm ${mensaje.tipo === "ok" ? "bg-[#EAF6EF] text-[#16845B]" : "bg-[#FDECEC] text-[#C73535]"}`}>
                    {mensaje.texto}
                </p>
            )}

            {patrocinadores.length === 0 ? (
                <p className="text-sm text-[#68737D]">Todavía no hay patrocinadores.</p>
            ) : (
                <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-[#D5D9DC]">
                    <table className="w-full text-sm">
                        <thead className="bg-[#F4F5F4] text-left text-xs uppercase text-[#68737D]">
                            <tr>
                                <th className="px-4 py-2">Nombre</th>
                                <th className="px-4 py-2">Tipo</th>
                                <th className="px-4 py-2">Web</th>
                                <th className="px-4 py-2 text-center">En esta prueba</th>
                                <th className="px-4 py-2 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patrocinadores.map((p) => (
                                <tr key={p.id} className="border-t border-[#D5D9DC]">
                                    <td className="px-4 py-2 font-medium">{p.nombre}</td>
                                    <td className="px-4 py-2">{p.tipo === "institucional" ? "Institucional" : "Comercial"}</td>
                                    <td className="px-4 py-2 text-[#68737D]">{p.webUrl ?? "—"}</td>
                                    <td className="px-4 py-2 text-center">
                                        <input
                                            type="checkbox"
                                            checked={asignadasSet.has(p.id)}
                                            disabled={pendiente}
                                            onChange={(e) =>
                                                ejecutar(
                                                    () =>
                                                        asignarPatrocinador({
                                                            pruebaId,
                                                            patrocinadorId: p.id,
                                                            asignar: e.target.checked,
                                                        }),
                                                    e.target.checked ? "Asignado a la prueba" : "Quitado de la prueba"
                                                )
                                            }
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="flex justify-end gap-3">
                                            <button type="button" onClick={() => setEditando(p)} className="underline">
                                                Editar
                                            </button>
                                            <button
                                                type="button"
                                                disabled={pendiente}
                                                onClick={() =>
                                                    ejecutar(
                                                        () => cambiarActivoPatrocinador({ id: p.id, activo: !p.activo }),
                                                        p.activo ? "Patrocinador desactivado" : "Patrocinador activado"
                                                    )
                                                }
                                                className={`underline disabled:opacity-50 ${p.activo ? "" : "text-[#68737D]"}`}
                                            >
                                                {p.activo ? "Desactivar" : "Activar"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}