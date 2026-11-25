"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NAVEGACION_MOVIL } from "@/lib/navegacion";

type Props = { logueado: boolean; accionSalir: () => Promise<void> };

export default function MobileMenu({ logueado, accionSalir }: Props) {
    const pathname = usePathname();
    const [abierto, setAbierto] = useState(false);
    const trigger = useRef<HTMLButtonElement>(null);
    const primerEnlace = useRef<HTMLAnchorElement>(null);
    const cerrar = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!abierto) return;
        primerEnlace.current?.focus();
        function manejarTecla(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setAbierto(false);
                trigger.current?.focus();
            }
        }
        document.addEventListener("keydown", manejarTecla);
        return () => document.removeEventListener("keydown", manejarTecla);
    }, [abierto]);

    function cerrarMenu() {
        setAbierto(false);
        trigger.current?.focus();
    }

    return (
        <div className="lg:hidden">
            <button ref={trigger} type="button" aria-expanded={abierto} aria-controls="menu-movil" aria-label={abierto ? "Cerrar menú" : "Abrir menú"} onClick={() => setAbierto((v) => !v)} className="mobile-menu-trigger flex h-11 w-11 flex-col items-center justify-center gap-1.5 rounded-md">
                <span className={`block h-0.5 w-6 bg-white transition ${abierto ? "translate-y-2 rotate-45" : ""}`} />
                <span className={`block h-0.5 w-6 bg-white transition ${abierto ? "opacity-0" : ""}`} />
                <span className={`block h-0.5 w-6 bg-white transition ${abierto ? "-translate-y-2 -rotate-45" : ""}`} />
            </button>

            {abierto && <nav id="menu-movil" aria-label="Menú móvil" className="fixed inset-x-0 bottom-0 top-[var(--header-height)] z-50 overflow-y-auto bg-navy px-6 py-8 text-white">
                <div className="mb-6 flex items-center justify-between">
                    <span className="text-sm font-semibold uppercase tracking-wider text-white/60">Navegación</span>
                    <button ref={cerrar} type="button" onClick={cerrarMenu} className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold transition hover:bg-white/10">Cerrar</button>
                </div>
                <ul className="space-y-5 text-lg font-semibold">
                    {NAVEGACION_MOVIL.map(({ href, texto }, index) => {
                        const activo = pathname === href || pathname.startsWith(`${href}/`);
                        return <li key={href}><Link ref={index === 0 ? primerEnlace : undefined} href={href} aria-current={activo ? "page" : undefined} onClick={() => setAbierto(false)} className={`transition-colors hover:text-coral ${activo ? "text-coral" : "text-white"}`}>{texto}</Link></li>;
                    })}
                </ul>
                <div className="mt-10 space-y-4 border-t border-white/10 pt-6">
                    {logueado ? <>
                        <Link href="/cuenta" onClick={() => setAbierto(false)} className="block text-lg font-semibold">Mi panel</Link>
                        <form action={accionSalir}><button type="submit" className="text-lg text-white/70">Salir</button></form>
                    </> : <Link href="/login" onClick={() => setAbierto(false)} className="block text-lg font-semibold">Acceso jugadores</Link>}
                </div>
            </nav>}
        </div>
    );
}
