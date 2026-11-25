"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NAVEGACION_MAS, NAVEGACION_PRINCIPAL } from "@/lib/navegacion";

export default function NavPrincipal() {
    const pathname = usePathname();
    const [abierto, setAbierto] = useState(false);
    const trigger = useRef<HTMLButtonElement>(null);
    const menu = useRef<HTMLUListElement>(null);
    const masActivo = NAVEGACION_MAS.some(({ href }) => pathname === href || pathname.startsWith(`${href}/`));

    useEffect(() => {
        if (!abierto) return;
        function manejarTecla(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setAbierto(false);
                trigger.current?.focus();
            }
        }
        function manejarClick(event: MouseEvent) {
            if (!menu.current?.parentElement?.contains(event.target as Node)) setAbierto(false);
        }
        document.addEventListener("keydown", manejarTecla);
        document.addEventListener("mousedown", manejarClick);
        return () => {
            document.removeEventListener("keydown", manejarTecla);
            document.removeEventListener("mousedown", manejarClick);
        };
    }, [abierto]);

    return (
        <nav aria-label="Navegación principal" className="hidden lg:block">
            <ul className="flex items-center gap-5 xl:gap-7 text-sm font-medium">
                {NAVEGACION_PRINCIPAL.map(({ href, texto }) => {
                    const activo = pathname === href || pathname.startsWith(`${href}/`);
                    return <li key={href}><Link href={href} aria-current={activo ? "page" : undefined} className={`underline-offset-4 transition-colors hover:text-white hover:underline hover:decoration-coral ${activo ? "text-white underline decoration-coral" : "text-white/85"}`}>{texto}</Link></li>;
                })}
                <li className="relative">
                    <button ref={trigger} type="button" aria-expanded={abierto} aria-controls="navegacion-mas" onClick={() => setAbierto((value) => !value)} className={`inline-flex items-center gap-1 underline-offset-4 transition-colors hover:text-white hover:underline hover:decoration-coral ${masActivo ? "text-white underline decoration-coral" : "text-white/85"}`}>
                        Más <span aria-hidden="true">⌄</span>
                    </button>
                    {abierto && <ul id="navegacion-mas" ref={menu} className="absolute right-0 top-full z-50 mt-3 min-w-56 space-y-1 rounded-xl border border-white/10 bg-navy p-2 shadow-xl">
                        {NAVEGACION_MAS.map(({ href, texto }) => {
                            const activo = pathname === href || pathname.startsWith(`${href}/`);
                            return <li key={href}><Link href={href} aria-current={activo ? "page" : undefined} onClick={() => setAbierto(false)} className={`block rounded-lg px-4 py-3 transition-colors hover:bg-white/10 hover:text-white ${activo ? "bg-white/10 text-white underline decoration-coral underline-offset-4" : "text-white"}`}>{texto}</Link></li>;
                        })}
                    </ul>}
                </li>
            </ul>
        </nav>
    );
}
