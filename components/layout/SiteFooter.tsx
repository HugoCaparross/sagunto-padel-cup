import Link from "next/link";
import Logo from "@/components/brand/Logo";
import GoogleIcon from "@/components/ui/GoogleIcon";

const GRUPOS = [
    {
        titulo: "El circuito",
        enlaces: [
            { href: "/calendario", texto: "Calendario" },
            { href: "/ranking", texto: "Ranking" },
            { href: "/premios", texto: "Premios" },
            { href: "/puntos", texto: "Puntuación" },
        ],
    },
    {
        titulo: "Información",
        enlaces: [
            { href: "/noticias", texto: "Noticias" },
            { href: "/faq", texto: "Preguntas frecuentes" },
            { href: "/contacto", texto: "Contacto" },
            { href: "/reglamento", texto: "Reglamento" },
        ],
    },
    {
        titulo: "Legal",
        enlaces: [
            { href: "/aviso-legal", texto: "Aviso legal" },
            { href: "/privacidad", texto: "Política de privacidad" },
            { href: "/cookies", texto: "Política de cookies" },
            { href: "/condiciones", texto: "Condiciones de participación" },
        ],
    },
];

export default function SiteFooter() {
    return (
        <footer className="bg-navy text-white">
            <div className="container grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.2fr_repeat(3,minmax(0,1fr))]">
                <div className="space-y-4">
                    <Logo />
                    <p className="max-w-xs text-sm text-white/70">
                        Circuito amateur de pádel en el Camp de Morvedre. Compite, suma puntos y lucha por el
                        Master Final.
                    </p>
                    <a
                        href="mailto:saguntopadelcup@gmail.com"
                        className="text-sm text-white/80 underline underline-offset-4 hover:text-white"
                    >
                        saguntopadelcup@gmail.com
                    </a>
                    <nav className="flex flex-wrap gap-3 pt-1" aria-label="Redes sociales">
                        <a
                            href="https://www.instagram.com/saguntopadelcup/"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Instagram de Sagunto Padel Cup (se abre en otra pestaña)"
                            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-2 text-sm text-white/80 transition-colors hover:border-white/40 hover:text-white"
                        >
                            <GoogleIcon name="photo_camera" />
                            Instagram
                        </a>
                        <a
                            href="https://www.tiktok.com/@saguntopadelcup"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="TikTok de Sagunto Padel Cup (se abre en otra pestaña)"
                            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-2 text-sm text-white/80 transition-colors hover:border-white/40 hover:text-white"
                        >
                            <GoogleIcon name="music_note" />
                            TikTok
                        </a>
                    </nav>
                </div>

                {GRUPOS.map((grupo) => (
                    <nav key={grupo.titulo} aria-label={grupo.titulo}>
                        <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-white">
                            {grupo.titulo}
                        </h2>
                        <ul className="grid gap-2 text-sm text-white/70">
                            {grupo.enlaces.map((enlace) => (
                                <li key={enlace.href}>
                                    <Link href={enlace.href} className="transition-colors hover:text-white">
                                        {enlace.texto}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                ))}
            </div>

            <div className="border-t border-white/10">
                <div className="container flex flex-col gap-3 py-5 text-xs text-white/60 md:flex-row md:items-center md:justify-between">
                    <p>© {new Date().getFullYear()} Sagunto Padel Cup. Todos los derechos reservados.</p>
                    <p>Hecho en Sagunto.</p>
                </div>
            </div>
        </footer>
    );
}