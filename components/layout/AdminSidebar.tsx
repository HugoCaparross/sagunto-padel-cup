"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cerrarSesion } from "@/actions/auth";
import Logo from "@/components/brand/Logo";

type Seccion = { href: string; texto: string };

const SECCIONES: Seccion[] = [
    { href: "/admin", texto: "Resumen" },
    { href: "/admin/pruebas", texto: "Pruebas" },
    { href: "/admin/inscripciones", texto: "Inscripciones" },
    { href: "/admin/jugadores", texto: "Jugadores" },
    { href: "/admin/ranking", texto: "Ranking" },
    { href: "/admin/patrocinio", texto: "Patrocinio y premios" },
    { href: "/admin/contenido", texto: "Noticias" },
    { href: "/admin/contactos", texto: "Contactos" },
    { href: "/admin/legal", texto: "Documentos legales" },
    { href: "/admin/analitica", texto: "Analítica" },
    { href: "/admin/ajustes", texto: "Ajustes" },
];

export default function AdminSidebar() {
    const ruta = usePathname();

    const activa = (href: string) =>
        href === "/admin" ? ruta === "/admin" : ruta === href || ruta.startsWith(`${href}/`);

    return (
        <aside className="border-b border-white/10 bg-navy text-white lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
            <div className="flex h-full flex-col gap-6 p-4 lg:p-6">
                <div className="flex items-center justify-between gap-4">
                    <Link href="/admin" aria-label="Administración Sagunto Padel Cup">
                        <Logo compact />
                    </Link>
                    <Link href="/" className="text-xs text-white/60 hover:text-white">
                        Ver web
                    </Link>
                </div>

                <nav aria-label="Administración" className="overflow-x-auto lg:overflow-visible">
                    <ul className="flex gap-1 whitespace-nowrap text-sm lg:flex-col">
                        {SECCIONES.map((s) => (
                            <li key={s.href}>
                                <Link
                                    href={s.href}
                                    className={`block rounded-md px-3 py-2 ${activa(s.href) ? "bg-white/15 font-medium" : "text-white/80 hover:bg-white/10"
                                        }`}
                                >
                                    {s.texto}
                                </Link>
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