"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
    { href: "/cuenta", texto: "Mi panel" },
    { href: "/cuenta/inscripciones", texto: "Inscripciones" },
    { href: "/cuenta/progreso", texto: "Mi progreso" },
    { href: "/buscar-pareja", texto: "Buscar pareja" },
    { href: "/cuenta/perfil", texto: "Mi perfil" },
];

export default function PlayerNav() {
    const ruta = usePathname();

    return (
        <nav aria-label="Área del jugador" className="border-b border-[#D5D9DC] bg-white">
            <ul className="container flex gap-1 overflow-x-auto py-2 text-sm">
                {ITEMS.map((i) => {
                    const activo = i.href === "/cuenta" ? ruta === "/cuenta" : ruta.startsWith(i.href);
                    return (
                        <li key={i.href}>
                            <Link
                                href={i.href}
                                className={`block whitespace-nowrap rounded-md px-3 py-1.5 ${activo ? "bg-[#0D1B2A] text-white" : "text-[#18232D] hover:bg-[#F4F5F4]"
                                    }`}
                            >
                                {i.texto}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}