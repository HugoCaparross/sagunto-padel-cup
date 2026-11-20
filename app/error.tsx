"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPagina({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <main className="container flex min-h-[60vh] flex-col items-start justify-center gap-4 py-16">
            <p className="text-sm uppercase tracking-wide text-muted">Algo ha fallado</p>
            <h1 className="heading-font text-5xl">No hemos podido cargar esta página</h1>
            <p className="max-w-xl text-muted">
                Puede ser un fallo temporal. Inténtalo de nuevo; si persiste, escríbenos.
            </p>
            {error.digest && <p className="text-xs text-muted">Código: {error.digest}</p>}
            <div className="flex gap-3">
                <button type="button" onClick={reset} className="btn btn-primario">
                    Reintentar
                </button>
                <Link href="/" className="btn btn-fantasma">
                    Ir al inicio
                </Link>
            </div>
        </main>
    );
}