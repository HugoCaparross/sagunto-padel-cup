import Link from "next/link";
import Logo from "@/components/brand/Logo";

const GRUPOS = [
    { titulo: "El circuito", enlaces: [{ href: "/calendario", texto: "Calendario" }, { href: "/ranking", texto: "Ranking" }, { href: "/premios", texto: "Premios" }, { href: "/puntos", texto: "Puntuación" }] },
    { titulo: "Información", enlaces: [{ href: "/noticias", texto: "Noticias" }, { href: "/faq", texto: "Preguntas frecuentes" }, { href: "/contacto", texto: "Contacto" }, { href: "/reglamento", texto: "Reglamento" }] },
    { titulo: "Legal", enlaces: [{ href: "/aviso-legal", texto: "Aviso legal" }, { href: "/privacidad", texto: "Política de privacidad" }, { href: "/cookies", texto: "Política de cookies" }, { href: "/condiciones", texto: "Condiciones de participación" }] },
];

function IconoGmail() {
    return <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M3 6.5 12 13l9-6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 5h16a1 1 0 0 1 1 1v12H3V6a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M3 7v11m18-11v11" stroke="currentColor" strokeWidth="2"/></svg>;
}
function IconoInstagram() {
    return <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.7" r=".8" fill="currentColor" stroke="none"/></svg>;
}
function IconoTikTok() {
    return <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M19.6 8.1a7.3 7.3 0 0 1-4.5-1.5v8a5.5 5.5 0 1 1-5.5-5.5c.4 0 .8 0 1.2.1v3a2.6 2.6 0 1 0 1.8 2.5V2.5h3a4.3 4.3 0 0 0 4 3.8v1.8Z"/></svg>;
}

export default function SiteFooter() {
    return <footer className="bg-navy text-white">
        <div className="container grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.2fr_repeat(4,minmax(0,1fr))]">
            <div className="space-y-4">
                <Logo />
                <p className="max-w-xs text-sm text-white/70">Circuito amateur de pádel en el Camp de Morvedre. Compite, suma puntos y lucha por el Master Final.</p>
                <div className="pt-2">
                    <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-white">Contáctanos</h2>
                    <nav className="flex flex-wrap gap-2" aria-label="Contacto y redes sociales">
                        <a href="mailto:saguntopadelcup@gmail.com" aria-label="Escribir a Sagunto Padel Cup por Gmail" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 px-4 text-sm text-white/85 transition-colors hover:border-white/50 hover:bg-white/10 hover:text-white"><IconoGmail />Correo</a>
                        <a href="https://www.instagram.com/saguntopadelcup/" target="_blank" rel="noopener noreferrer" aria-label="Instagram de Sagunto Padel Cup (se abre en otra pestaña)" className="inline-flex min-h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white/85 transition-colors hover:border-white/50 hover:bg-white/10 hover:text-white"><IconoInstagram /></a>
                        <a href="https://www.tiktok.com/@saguntopadelcup" target="_blank" rel="noopener noreferrer" aria-label="TikTok de Sagunto Padel Cup (se abre en otra pestaña)" className="inline-flex min-h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white/85 transition-colors hover:border-white/50 hover:bg-white/10 hover:text-white"><IconoTikTok /></a>
                    </nav>
                </div>
            </div>
            <nav aria-label="Patrocinadores"><h2 className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-white">Colabora</h2><Link href="/patrocinadores" className="text-sm text-white/70 transition-colors hover:text-white">Patrocinadores</Link></nav>
            {GRUPOS.map((grupo) => <nav key={grupo.titulo} aria-label={grupo.titulo}><h2 className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-white">{grupo.titulo}</h2><ul className="grid gap-2 text-sm text-white/70">{grupo.enlaces.map((enlace) => <li key={enlace.href}><Link href={enlace.href} className="transition-colors hover:text-white">{enlace.texto}</Link></li>)}</ul></nav>)}
        </div>
        <div className="border-t border-white/10"><div className="container flex flex-col gap-3 py-5 text-xs text-white/60 md:flex-row md:items-center md:justify-between"><p>© {new Date().getFullYear()} Sagunto Padel Cup. Todos los derechos reservados.</p><p>Hecho en Sagunto.</p></div></div>
    </footer>;
}
