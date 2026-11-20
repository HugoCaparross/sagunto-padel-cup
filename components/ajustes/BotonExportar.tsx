"use client";

import { useState, useTransition } from "react";
import { exportarDatos } from "@/actions/ajustes";

type Props = {
    recurso: "jugadores" | "inscripciones" | "puntos" | "auditoria";
    etiqueta: string;
};

export default function BotonExportar({ recurso, etiqueta }: Props) {
    const [pendiente, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    function descargar() {
        setError(null);
        startTransition(async () => {
            const res = await exportarDatos({ recurso });
            if (!res.ok) {
                setError(res.error);
                return;
            }
            const blob = new Blob([res.contenido], { type: "text/csv;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const enlace = document.createElement("a");
            enlace.href = url;
            enlace.download = res.nombre;
            enlace.click();
            URL.revokeObjectURL(url);
        });
    }

    return (
        <div className="space-y-1">
            <button
                type="button"
                onClick={descargar}
                disabled={pendiente}
                className="btn btn-fantasma"
            >
                {pendiente ? "Preparando…" : etiqueta}
            </button>
            {error && <p className="text-xs text-danger">{error}</p>}
        </div>
    );
}