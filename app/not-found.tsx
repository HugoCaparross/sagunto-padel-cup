import Link from "next/link";

export default function NotFound() {
    return (
        <main className="not-found">
            <div className="not-found__content">
                <p className="not-found__eyebrow">Error 404</p>
                <h1>Página no encontrada</h1>
                <p>
                    La página que buscas no existe, ha cambiado de dirección o ya no está disponible.
                </p>
                <Link href="/">Volver al inicio</Link>
            </div>
        </main>
    );
}
