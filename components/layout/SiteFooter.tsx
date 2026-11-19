import Link from "next/link";

const LEGAL = [
    { href: "/aviso-legal", texto: "Aviso legal" },
    { href: "/privacidad", texto: "Política de privacidad" },
    { href: "/cookies", texto: "Política de cookies" },
    { href: "/condiciones", texto: "Condiciones de participación" },
];

const COMPETICION = [
    { href: "/reglamento", texto: "Reglamento del circuito" },
    { href: "/puntos", texto: "Sistema de puntos" },
    { href: "/circuito", texto: "El circuito" },
];

export default function SiteFooter() {
    return (
        <footer className="bg-[#0D1B2A] text-white">
            <div className="mx-auto grid max-w-[1280px] gap-8 px-6 py-12 sm:grid-cols-3">
                <div className="space-y-2">
                    <p className="font-semibold">Sagunto Padel Cup</p>
                    <p className="text-sm text-white/70">
                        Circuito amateur de pádel en el Camp de Morvedre.
                    </p>
                    <a
                        href="mailto:saguntopadelcup@gmail.com"
                        className="text-sm underline underline-offset-2"
                    >
                        saguntopadelcup@gmail.com
                    </a>
                </div>

                <nav aria-label="Legal">
                    <p className="mb-2 text-xs uppercase tracking-wide text-white/50">Legal</p>
                    <ul className="space-y-1 text-sm">
                        {LEGAL.map((e) => (
                            <li key={e.href}>
                                <Link href={e.href} className="hover:underline">
                                    {e.texto}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                <nav aria-label="Competición">
                    <p className="mb-2 text-xs uppercase tracking-wide text-white/50">Competición</p>
                    <ul className="space-y-1 text-sm">
                        {COMPETICION.map((e) => (
                            <li key={e.href}>
                                <Link href={e.href} className="hover:underline">
                                    {e.texto}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>

            <div className="border-t border-white/10 px-6 py-4 text-center text-xs text-white/50">
                © {new Date().getFullYear()} Sagunto Padel Cup
            </div>
        </footer>
    );
}