import Link from "next/link";

export default function NotFound() {
    return (
        <main
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
                background: "#FAFAF9",
                color: "#0D1B2A",
                fontFamily: "var(--font-montserrat), Arial, sans-serif",
                textAlign: "center",
            }}
        >
            <div style={{ maxWidth: "480px" }}>
                <p
                    style={{
                        margin: "0 0 12px",
                        color: "#F0443A",
                        fontSize: "14px",
                        fontWeight: 700,
                        letterSpacing: "0.12em",
                    }}
                >
                    ERROR 404
                </p>

                <h1
                    style={{
                        margin: "0 0 16px",
                        fontFamily: "var(--font-bebas), sans-serif",
                        fontSize: "clamp(48px, 8vw, 80px)",
                        lineHeight: 1,
                    }}
                >
                    PÁGINA NO ENCONTRADA
                </h1>

                <p
                    style={{
                        margin: "0 0 28px",
                        lineHeight: 1.7,
                        color: "#68737D",
                    }}
                >
                    La página que buscas no existe, ha cambiado de dirección
                    o ya no está disponible.
                </p>

                <Link
                    href="/"
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: "48px",
                        padding: "0 24px",
                        borderRadius: "8px",
                        background: "#F0443A",
                        color: "#FFFFFF",
                        textDecoration: "none",
                        fontWeight: 700,
                    }}
                >
                    VOLVER AL INICIO
                </Link>
            </div>
        </main>
    );
}