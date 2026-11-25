"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { actualizarPlazasTemporada } from "@/actions/ranking-admin";

type Props = {
    temporadaId: number;
    plazasAscenso: number;
    plazasDescenso: number;
};

export default function FormPlazas({ temporadaId, plazasAscenso, plazasDescenso }: Props) {
    const router = useRouter();
    const [pendiente, startTransition] = useTransition();
    const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

    function guardar(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const f = new FormData(e.currentTarget);

        setMensaje(null);
        startTransition(async () => {
            const res = await actualizarPlazasTemporada({
                temporadaId,
                plazasAscenso: Number(f.get("ascenso")),
                plazasDescenso: Number(f.get("descenso")),
            });
            if (res.ok) {
                setMensaje({ tipo: "ok", texto: "Plazas guardadas" });
                router.refresh();
            } else {
                setMensaje({ tipo: "error", texto: res.error });
            }
        });
    }

    return (
        <form
            onSubmit={guardar}
            className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 text-sm ring-1 ring-[var(--color-border)]"
        >
            <label className="flex flex-col gap-1">
                <span className="text-[var(--color-muted)]">Plazas de ascenso por categoría</span>
                <input
                    name="ascenso"
                    type="number"
                    min={0}
                    max={10}
                    defaultValue={plazasAscenso}
                    className="w-28 rounded-md border border-[var(--color-border)] px-2 py-1.5"
                />
            </label>

            <label className="flex flex-col gap-1">
                <span className="text-[var(--color-muted)]">Plazas de descenso por categoría</span>
                <input
                    name="descenso"
                    type="number"
                    min={0}
                    max={10}
                    defaultValue={plazasDescenso}
                    className="w-28 rounded-md border border-[var(--color-border)] px-2 py-1.5"
                />
            </label>

            <button
                type="submit"
                disabled={pendiente}
                className="rounded-lg bg-white px-3 py-2 ring-1 ring-[var(--color-border)] disabled:opacity-50"
            >
                {pendiente ? "Guardando…" : "Guardar plazas"}
            </button>

            {mensaje && (
                <span
                    className={`text-sm ${mensaje.tipo === "ok" ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}
                >
                    {mensaje.texto}
                </span>
            )}
        </form>
    );
}