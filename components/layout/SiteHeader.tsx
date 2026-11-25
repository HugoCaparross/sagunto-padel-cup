import Link from "next/link";
import { cerrarSesion } from "@/actions/auth";
import Logo from "@/components/brand/Logo";
import MobileMenu from "@/components/layout/MobileMenu";
import NavPrincipal from "@/components/layout/NavPrincipal";
import { crearClienteServidor } from "@/lib/supabase/server";
import GoogleIcon from "@/components/ui/GoogleIcon";

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

                <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                    <Link href={user ? "/cuenta" : "/login"} aria-label={user ? "Mi panel de jugador" : "Acceso jugadores"} className="hidden h-11 w-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 lg:inline-flex">
                        <GoogleIcon name="person" />
                        <span className="sr-only">{user ? "Mi panel de jugador" : "Acceso jugadores"}</span>
                    </Link>
                    <Link href="/calendario" className="btn btn-primario">
                        Inscribirse
                    </Link>
                    <MobileMenu logueado={user !== null} accionSalir={cerrarSesion} />
                </div>
            </div>
        </header>
    );
}
