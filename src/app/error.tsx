"use client";

export default function ErrorPage({
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <main
            style={{
                minHeight: "70vh",
                display: "grid",
                placeItems: "center",
                padding: 24,
                textAlign: "center",
            }}
        >
            <div>
                <h1>Ha ocurrido un error</h1>

                <p>No se ha podido cargar esta página.</p>

                <button onClick={() => reset()}>
                    Volver a intentarlo
                </button>
            </div>
        </main>
    );
}