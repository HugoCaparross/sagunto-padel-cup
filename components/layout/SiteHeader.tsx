import Link from "next/link";
import { cerrarSesion } from "@/actions/auth";
import Logo from "@/components/brand/Logo";
import MobileMenu from "@/components/layout/MobileMenu";
import NavPrincipal from "@/components/layout/NavPrincipal";
import { crearClienteServidor } from "@/lib/supabase/server";

export default async function SiteHeader() {
    const supabase = await crearClienteServidor();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    return (
        <header
            className="site-header sticky top-0 z-40 border-b border-white/10 bg-navy text-white"
            style={{ height: "var(--header-height)" }}
        >
            <div className="container flex h-full items-center justify-between gap-6">
                <Link href="/" aria-label="Inicio" className="site-logo shrink-0">
                    <Logo />
                </Link>

                <NavPrincipal />

                <div className="flex items-center gap-2 sm:gap-3">
                    {user ? (
                        <Link href="/cuenta" className="btn btn-claro hidden sm:inline-flex">
                            Mi panel
                        </Link>
                    ) : (
                        <Link href="/login" className="btn btn-claro hidden sm:inline-flex">
                            Acceso jugadores
                        </Link>
                    )}
                    <Link href="/calendario" className="btn btn-primario">
                        Inscribirse
                    </Link>
                    <MobileMenu logueado={user !== null} accionSalir={cerrarSesion} />
                </div>
            </div>
        </header>
    );
}