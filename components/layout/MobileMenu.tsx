"use client";

import Link from "next/link";
import { useState } from "react";
import { NAVEGACION_PUBLICA } from "@/lib/navegacion";

type Props = {
    logueado: boolean;
    accionSalir: () => Promise<void>;
};

export default function MobileMenu({ logueado, accionSalir }: Props) {
    const [abierto, setAbierto] = useState(false);

    return (
        <div className="lg:hidden">
            <button
                type="button"
                aria-expanded={abierto}
                aria-controls="menu-movil"
                aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
                onClick={() => setAbierto((v) => !v)}
                className="mobile-menu-trigger flex h-11 w-11 flex-col items-center justify-center gap-1.5 rounded-md"
            >
                <span className={`block h-0.5 w-6 bg-white transition ${abierto ? "translate-y-2 rotate-45" : ""}`} />
                <span className={`block h-0.5 w-6 bg-white transition ${abierto ? "opacity-0" : ""}`} />
                <span className={`block h-0.5 w-6 bg-white transition ${abierto ? "-translate-y-2 -rotate-45" : ""}`} />
            </button>

            {abierto && (
                <nav
                    id="menu-movil"
                    aria-label="Menú móvil"
                    className="fixed inset-x-0 bottom-0 top-[var(--header-height)] z-50 overflow-y-auto bg-navy px-6 py-8 text-white"
                >
                    <ul className="space-y-5 text-lg font-semibold">
                        {NAVEGACION_PUBLICA.map((item) => (
                            <li key={item.href}>
                                <Link href={item.href} onClick={() => setAbierto(false)}>
                                    {item.texto}
                                </Link>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-10 space-y-4 border-t border-white/10 pt-6">
                        {logueado ? (
                            <>
                                <Link href="/cuenta" onClick={() => setAbierto(false)} className="block text-lg font-semibold">
                                    Mi panel
                                </Link>
                                <form action={accionSalir}>
                                    <button type="submit" className="text-lg text-white/70">
                                        Salir
                                    </button>
                                </form>
                            </>
                        ) : (
                            <Link href="/login" onClick={() => setAbierto(false)} className="block text-lg font-semibold">
                                Acceso jugadores
                            </Link>
                        )}
                    </div>
                </nav>
            )}
        </div>
    );
}