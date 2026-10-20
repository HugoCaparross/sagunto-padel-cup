import Link from "next/link";

export default function NotFound() {
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
                <p>404</p>

                <h1>Página no encontrada</h1>

                <p>
                    La dirección que buscas no existe o ha cambiado.
                </p>

                <Link href="/">Volver al inicio</Link>
            </div>
        </main>
    );
}