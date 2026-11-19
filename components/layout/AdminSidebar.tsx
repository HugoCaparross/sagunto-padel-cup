"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cerrarSesion } from "@/actions/auth";

type Seccion = { href: string; texto: string; disponible: boolean };

const SECCIONES: Seccion[] = [
    { href: "/admin", texto: "Resumen", disponible: true },
    { href: "/admin/pruebas", texto: "Pruebas", disponible: true },
    { href: "/admin/jugadores", texto: "Jugadores", disponible: true },
    { href: "/admin/ranking", texto: "Ranking", disponible: true },
    { href: "/admin/patrocinio", texto: "Patrocinio y premios", disponible: true },
    { href: "/admin/contenido", texto: "Noticias", disponible: true },
    { href: "/admin/contactos", texto: "Contactos", disponible: true },
    { href: "/admin/legal", texto: "Documentos legales", disponible: true },
    { href: "/admin/analitica", texto: "Analítica", disponible: false },
    { href: "/admin/ajustes", texto: "Ajustes", disponible: false },
];

export default function AdminSidebar() {
    const ruta = usePathname();

    const activa = (href: string) =>
        href === "/admin" ? ruta === "/admin" : ruta === href || ruta.startsWith(`${href}/`);

    return (
        <aside className="border-b border-white/10 bg-[#0D1B2A] text-white lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
            <div className="flex h-full flex-col gap-6 p-4 lg:p-6">
                <div className="flex items-center justify-between gap-4">
                    <Link href="/admin" className="heading-font text-lg tracking-wide">
                        ADMIN <span className="text-[#F0443A]">PADEL CUP</span>
                    </Link>
                    <Link href="/" className="text-xs text-white/60 hover:text-white">
                        Ver web
                    </Link>
                </div>

                <nav aria-label="Administración" className="overflow-x-auto lg:overflow-visible">
                    <ul className="flex gap-1 whitespace-nowrap text-sm lg:flex-col">
                        {SECCIONES.map((s) => (
                            <li key={s.href}>
                                {s.disponible ? (
                                    <Link
                                        href={s.href}
                                        className={`block rounded-md px-3 py-2 ${activa(s.href) ? "bg-white/15 font-medium" : "text-white/80 hover:bg-white/10"
                                            }`}
                                    >
                                        {s.texto}
                                    </Link>
                                ) : (
                                    <span
                                        className="flex cursor-not-allowed items-center justify-between rounded-md px-3 py-2 text-white/40"
                                        aria-disabled="true"
                                    >
                                        {s.texto}
                                        <span className="text-[10px] uppercase tracking-wide">Pronto</span>
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                </nav>

                <form action={cerrarSesion} className="mt-auto hidden lg:block">
                    <button type="submit" className="text-sm text-white/60 hover:text-white">
                        Cerrar sesión
                    </button>
                </form>
            </div>
        </aside>
    );
}