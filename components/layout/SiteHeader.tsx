import Link from "next/link";
import { cerrarSesion } from "@/actions/auth";
import Logo from "@/components/brand/Logo";
import MobileMenu from "@/components/layout/MobileMenu";
import { NAVEGACION_PUBLICA } from "@/lib/navegacion";
import { crearClienteServidor } from "@/lib/supabase/server";

export default async function SiteHeader() {
    const supabase = await crearClienteServidor();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    let inicial = "";
    if (user) {
        const { data: perfil } = await supabase
            .from("perfiles")
            .select("nombre")
            .eq("id", user.id)
            .maybeSingle<{ nombre: string }>();
        inicial = (perfil?.nombre ?? "").trim().charAt(0).toUpperCase() || "?";
    }

    return (
        <header
            className="sticky top-0 z-40 border-b border-white/10 bg-[#0D1B2A] text-white"
            style={{ height: "var(--header-height)" }}
        >
            <div className="container flex h-full items-center justify-between gap-4">
                <Link href="/" aria-label="Inicio" className="shrink-0">
                    <Logo className="text-xl" />
                </Link>

                <nav aria-label="Principal" className="hidden lg:block">
                    <ul className="flex items-center gap-5 text-sm">
                        {NAVEGACION_PUBLICA.map((item) => (
                            <li key={item.href}>
                                <Link href={item.href} className="hover:underline underline-offset-4">
                                    {item.texto}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="flex items-center gap-3">
                    <Link
                        href="/calendario"
                        className="hidden rounded-lg bg-[#F0443A] px-4 py-2 text-sm font-medium text-white sm:inline-block"
                    >
                        Inscribirse
                    </Link>

                    {user ? (
                        <>
                            <Link
                                href="/cuenta"
                                aria-label="Mi panel"
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#A7C4A0] text-sm font-semibold text-[#0D1B2A]"
                            >
                                {inicial}
                            </Link>
                            <form action={cerrarSesion} className="hidden lg:block">
                                <button type="submit" className="text-sm text-white/70 hover:text-white">
                                    Salir
                                </button>
                            </form>
                        </>
                    ) : (
                        <Link href="/login" className="hidden text-sm sm:inline">
                            Entrar
                        </Link>
                    )}

                    <MobileMenu logueado={user !== null} accionSalir={cerrarSesion} />
                </div>
            </div>
        </header>
    );
}