"use client";

import { useEffect } from "react";

type GlobalErrorProps = {
    error: Error & { digest?: string };
    reset: () => void;
};

export default function GlobalError({
    error,
    reset,
}: GlobalErrorProps) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <main
            style={{
                minHeight: "60vh",
                display: "grid",
                placeItems: "center",
                padding: 32,
                textAlign: "center",
            }}
        >
            <div>
                <p
                    style={{
                        color: "#e61219",
                        fontWeight: 800,
                        letterSpacing: ".1em",
                    }}
                >
                    SAGUNTO PADEL CUP
                </p>
                <h1>Ha ocurrido un error</h1>
                <p>
                    No hemos podido cargar esta página. Puedes volver a
                    intentarlo.
                </p>
                <button
                    type="button"
                    onClick={reset}
                    style={{
                        marginTop: 16,
                        padding: "12px 18px",
                        background: "#050505",
                        color: "#fff",
                        border: 0,
                        cursor: "pointer",
                    }}
                >
                    REINTENTAR
                </button>
            </div>
        </main>
    );
}
