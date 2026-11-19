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
                className="rounded-md p-2 text-white"
            >
                {abierto ? "✕" : "☰"}
            </button>

            {abierto && (
                <nav
                    id="menu-movil"
                    aria-label="Menú móvil"
                    className="fixed inset-x-0 bottom-0 top-[var(--header-height)] z-50 overflow-y-auto bg-[#0D1B2A] px-6 py-8 text-white"
                >
                    <ul className="space-y-5 text-lg">
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
                                <Link href="/cuenta" onClick={() => setAbierto(false)} className="block text-lg">
                                    Mi panel
                                </Link>
                                <form action={accionSalir}>
                                    <button type="submit" className="text-lg text-white/70">
                                        Salir
                                    </button>
                                </form>
                            </>
                        ) : (
                            <Link href="/login" onClick={() => setAbierto(false)} className="block text-lg">
                                Entrar
                            </Link>
                        )}
                    </div>
                </nav>
            )}
        </div>
    );
}