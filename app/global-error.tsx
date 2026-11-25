"use client";

export default function ErrorGlobal({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="es">
            <body
                style={{
                    margin: 0,
                    fontFamily: "Arial, Helvetica, sans-serif",
                    background: "var(--color-surface)",
                    color: "var(--color-ink)",
                }}
            >
                <main style={{ maxWidth: 560, margin: "0 auto", padding: "64px 24px" }}>
                    <h1 style={{ fontSize: 28, margin: "0 0 12px" }}>Algo ha fallado</h1>
                    <p style={{ margin: "0 0 16px" }}>Vuelve a intentarlo en unos segundos.</p>
                    {error.digest && (
                        <p style={{ fontSize: 12, color: "var(--color-muted)" }}>Código: {error.digest}</p>
                    )}
                    <button
                        type="button"
                        onClick={reset}
                        style={{
                            background: "var(--color-coral)",
                            color: "var(--color-reference-ffffff)",
                            border: 0,
                            padding: "10px 16px",
                            borderRadius: 8,
                            cursor: "pointer",
                        }}
                    >
                        Reintentar
                    </button>
                </main>
            </body>
        </html>
    );
}