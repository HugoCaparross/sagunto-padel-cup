"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAVEGACION_PUBLICA } from "@/lib/navegacion";

export default function NavPrincipal() {
    const ruta = usePathname();

    const activo = (href: string) =>
        href === "/" ? ruta === "/" : ruta === href || ruta.startsWith(`${href}/`);

    return (
        <nav aria-label="Principal" className="hidden lg:block">
            <ul className="flex items-center gap-7 text-sm font-semibold">
                {NAVEGACION_PUBLICA.map((e) => (
                    <li key={e.href}>
                        <Link
                            href={e.href}
                            aria-current={activo(e.href) ? "page" : undefined}
                            className={`block border-b-2 pb-1 transition-colors ${activo(e.href)
                                    ? "border-coral text-white"
                                    : "border-transparent text-white/80 hover:text-white"
                                }`}
                        >
                            {e.texto}
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
}