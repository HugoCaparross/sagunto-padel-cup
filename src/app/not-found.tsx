import Link from "next/link";

export default function NotFound() {
    return <main style={{ minHeight: "70vh", display: "grid", placeItems: "center", padding: 32, textAlign: "center" }}><div><p style={{ color: "#e61219", fontWeight: 800, letterSpacing: ".1em" }}>404</p><h1>Página no encontrada</h1><p>El contenido solicitado no está disponible o ya no es público.</p><Link href="/" style={{ display: "inline-block", marginTop: 16, padding: "12px 18px", background: "#050505", color: "#fff", textDecoration: "none" }}>VOLVER AL INICIO</Link></div></main>;
}
