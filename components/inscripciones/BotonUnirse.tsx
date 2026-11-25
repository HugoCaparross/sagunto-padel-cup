"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { unirseAInscripcion } from "@/actions/inscripciones";

export default function BotonUnirse({ inscripcionId }: { inscripcionId: string }) {
    const router = useRouter();
    const [pendiente, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    function unirme() {
        setError(null);
        startTransition(async () => {
            const res = await unirseAInscripcion({ inscripcionId });
            if (res.ok) {
                router.refresh();
            } else {
                setError(res.error);
            }
        });
    }

    return (
        <div className="space-y-1 text-right">
            <button
                type="button"
                onClick={unirme}
                disabled={pendiente}
                className="btn btn-primario"
            >
                {pendiente ? "Uniéndome…" : "Unirme como pareja"}
            </button>
            {error && <p className="text-sm text-danger">{error}</p>}
        </div>
    );
}