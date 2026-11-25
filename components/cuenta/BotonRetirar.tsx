"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { retirarInscripcion } from "@/actions/inscripciones";

export default function BotonRetirar({ inscripcionId }: { inscripcionId: string }) {
    const router = useRouter();
    const [pendiente, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    function retirar() {
        if (!window.confirm("¿Retirar la inscripción? Dejará de ocupar plaza.")) return;

        startTransition(async () => {
            const res = await retirarInscripcion({ inscripcionId });
            if (res.ok) {
                router.refresh();
            } else {
                setError(res.error);
            }
        });
    }

    return (
        <div className="space-y-1">
            <button
                type="button"
                onClick={retirar}
                disabled={pendiente}
                className="text-sm text-[var(--color-danger)] underline disabled:opacity-50"
            >
                {pendiente ? "Retirando…" : "Retirarme"}
            </button>
            {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
        </div>
    );
}