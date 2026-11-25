"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cambiarEstadoPrueba } from "@/actions/pruebas";
import { ETIQUETAS_ESTADO_PRUEBA, type EstadoPrueba as Estado } from "@/lib/constantes";
import { TRANSICIONES, requiereMotivo } from "@/lib/pruebas/transiciones";

type Props = {
    pruebaId: string;
    estado: Estado;
};

export default function EstadoPrueba({ pruebaId, estado }: Props) {
    const router = useRouter();
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pendientes, setPendientes] = useState<string[]>([]);

    async function cambiar(hasta: Estado) {
        let motivo: string | undefined;
        if (requiereMotivo(estado, hasta)) {
            const m = window.prompt("Motivo para reabrir las inscripciones (mínimo 10 caracteres):");
            if (!m) return;
            motivo = m;
        }

        setEnviando(true);
        setError(null);
        setPendientes([]);

        const res = await cambiarEstadoPrueba({ pruebaId, estado: hasta, motivo });

        setEnviando(false);
        if (res.ok) {
            router.refresh();
        } else {
            setError(res.error);
            setPendientes(res.pendientes ?? []);
        }
    }

    const siguientes = TRANSICIONES[estado];

    return (
        <section className="space-y-3 rounded-xl bg-white p-4 ring-1 ring-[var(--color-border)]">
            <p className="text-sm text-[var(--color-muted)]">Estado actual</p>
            <p className="text-lg font-semibold">{ETIQUETAS_ESTADO_PRUEBA[estado]}</p>

            {siguientes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {siguientes.map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => cambiar(s)}
                            disabled={enviando}
                            className="rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-[var(--color-border)] disabled:opacity-50"
                        >
                            Pasar a: {ETIQUETAS_ESTADO_PRUEBA[s]}
                        </button>
                    ))}
                </div>
            )}

            {error && (
                <div className="rounded-lg bg-[var(--color-danger-bg)] p-3 text-sm text-[var(--color-danger)]">
                    <p>{error}</p>
                    {pendientes.map((p) => (
                        <p key={p}>· {p}</p>
                    ))}
                </div>
            )}
        </section>
    );
}