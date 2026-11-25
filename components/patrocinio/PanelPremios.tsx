"use client";

import Boton from "@/components/ui/Boton";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { eliminarPremio, guardarPremio } from "@/actions/patrocinio";
import {
    CATEGORIAS,
    CUADROS,
    ETIQUETAS_CATEGORIA,
    ETIQUETAS_CUADRO,
    type Categoria,
    type Cuadro,
} from "@/lib/constantes";
import { fechaCorta } from "@/lib/formato";
import type { PremioAdmin } from "@/lib/patrocinio/admin";

type Props = {
    pruebaId: string;
    premios: PremioAdmin[];
};

const CAMPO = "rounded-md border border-[var(--color-border)] bg-white px-2 py-1.5 text-sm";

export default function PanelPremios({ pruebaId, premios }: Props) {
    const router = useRouter();
    const [pendiente, startTransition] = useTransition();
    const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
    const [categoria, setCategoria] = useState<Categoria>("segunda");
    const [cuadro, setCuadro] = useState<Cuadro>("oro");

    // Al elegir categoría y cuadro existentes, se rellena el formulario con ese premio
    const existente = premios.find((p) => p.categoria === categoria && p.cuadro === cuadro);

    function guardar(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const revelarEl = String(f.get("revelarEl") ?? "");

        setMensaje(null);
        startTransition(async () => {
            const r = await guardarPremio({
                pruebaId,
                categoria,
                cuadro,
                descripcion: String(f.get("descripcion") ?? ""),
                revelarEl: revelarEl || null,
            });
            if (r.ok) {
                setMensaje({ tipo: "ok", texto: "Premio guardado" });
                router.refresh();
            } else {
                setMensaje({ tipo: "error", texto: r.error });
            }
        });
    }

    function eliminar(p: PremioAdmin) {
        const motivo = window.prompt(
            `Motivo para eliminar el premio de ${ETIQUETAS_CUADRO[p.cuadro]} (mínimo 10 caracteres):`
        );
        if (!motivo) return;

        setMensaje(null);
        startTransition(async () => {
            const r = await eliminarPremio({ id: p.id, motivo });
            if (r.ok) {
                setMensaje({ tipo: "ok", texto: "Premio eliminado" });
                router.refresh();
            } else {
                setMensaje({ tipo: "error", texto: r.error });
            }
        });
    }

    return (
        <section className="space-y-4">
            <div>
                <h2 className="font-semibold">Premios</h2>
                <p className="text-xs text-[var(--color-muted)]">
                    Con fecha de revelación, el premio aparece como sorpresa hasta ese día. Sin fecha, se ve de inmediato.
                </p>
            </div>

            <form
                key={`${categoria}-${cuadro}-${existente?.id ?? "nuevo"}`}
                onSubmit={guardar}
                className="grid gap-3 rounded-xl bg-white p-4 text-sm ring-1 ring-[var(--color-border)] md:grid-cols-4"
            >
                <label className="flex flex-col gap-1">
                    <span className="text-[var(--color-muted)]">Categoría</span>
                    <select
                        value={categoria}
                        onChange={(e) => setCategoria(e.target.value as Categoria)}
                        className={CAMPO}
                    >
                        {CATEGORIAS.map((c) => (
                            <option key={c} value={c}>
                                {ETIQUETAS_CATEGORIA[c]}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="flex flex-col gap-1">
                    <span className="text-[var(--color-muted)]">Cuadro</span>
                    <select
                        value={cuadro}
                        onChange={(e) => setCuadro(e.target.value as Cuadro)}
                        className={CAMPO}
                    >
                        {CUADROS.map((q) => (
                            <option key={q} value={q}>
                                {ETIQUETAS_CUADRO[q]}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="flex flex-col gap-1 md:col-span-2">
                    <span className="text-[var(--color-muted)]">Premio</span>
                    <input
                        name="descripcion"
                        defaultValue={existente?.descripcion ?? ""}
                        required
                        minLength={3}
                        maxLength={300}
                        className={CAMPO}
                    />
                </label>

                <label className="flex flex-col gap-1">
                    <span className="text-[var(--color-muted)]">Se revela el (opcional)</span>
                    <input name="revelarEl" type="date" defaultValue={existente?.revelarEl ?? ""} className={CAMPO} />
                </label>

                <div className="md:col-span-4">
                    <Boton variante="secundario" tamano="md"
                        type="submit"
                        disabled={pendiente}
                        className="disabled:opacity-50"
                    >
                        {existente ? "Actualizar premio" : "Crear premio"}
                    </Boton>
                </div>
            </form>

            {mensaje && (
                <p className={`rounded-lg p-3 text-sm ${mensaje.tipo === "ok" ? "bg-[var(--color-success-bg)] text-[var(--color-success)]" : "bg-[var(--color-danger-bg)] text-[var(--color-danger)]"}`}>
                    {mensaje.texto}
                </p>
            )}

            {premios.length === 0 ? (
                <p className="text-sm text-[var(--color-muted)]">Esta prueba todavía no tiene premios.</p>
            ) : (
                <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-[var(--color-border)]">
                    <table className="w-full text-sm">
                        <thead className="bg-[var(--color-surface)] text-left text-xs uppercase text-[var(--color-muted)]">
                            <tr>
                                <th className="px-4 py-2">Categoría</th>
                                <th className="px-4 py-2">Cuadro</th>
                                <th className="px-4 py-2">Premio</th>
                                <th className="px-4 py-2">Revelación</th>
                                <th className="px-4 py-2 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {premios.map((p) => (
                                <tr key={p.id} className="border-t border-[var(--color-border)]">
                                    <td className="px-4 py-2">{ETIQUETAS_CATEGORIA[p.categoria]}</td>
                                    <td className="px-4 py-2">{ETIQUETAS_CUADRO[p.cuadro]}</td>
                                    <td className="px-4 py-2">{p.descripcion}</td>
                                    <td className="px-4 py-2 text-[var(--color-muted)]">
                                        {p.revelarEl ? fechaCorta(p.revelarEl) : "Visible ya"}
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        <button
                                            type="button"
                                            onClick={() => eliminar(p)}
                                            disabled={pendiente}
                                            className="text-[var(--color-danger)] underline disabled:opacity-50"
                                        >
                                            Eliminar
                                        </button>
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