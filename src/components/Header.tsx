// Ruta: src/components/Header.tsx — sustituye entero al archivo actual
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(public)/login/actions";
import MobileMenu from "@/components/MobileMenu";

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const esAdmin = user?.email === process.env.ADMIN_EMAIL;

  // CTA "Inscríbete": apunta al próximo torneo con inscripciones abiertas, si existe
  const { data: torneoAbierto } = await supabase
    .from("tournaments")
    .select("slug")
    .eq("estado", "inscripciones_abiertas")
    .order("fecha_inicio")
    .limit(1)
    .maybeSingle();

  const hrefInscribete = torneoAbierto
    ? `/torneo/${torneoAbierto.slug}/inscribirse`
    : "/calendario";

  return (
    <header className="bg-navy text-offwhite px-5 py-4 flex items-center justify-between sticky top-0 z-40 shadow-md shadow-navy/20">
      <Link href="/" className="font-display text-lg tracking-wide">
        Sagunto Padel Cup
      </Link>

      {/* Navegación desktop */}
      <nav className="hidden sm:flex items-center gap-6 text-sm">
        <Link href="/calendario" className="hover:text-sage transition-colors">
          Calendario
        </Link>
        <Link href="/ranking" className="hover:text-sage transition-colors">
          Ranking
        </Link>
        <Link href="/master-final" className="hover:text-sage transition-colors">
          Master Final
        </Link>
        <Link href="/circuito" className="hover:text-sage transition-colors">
          El Circuito
        </Link>
        <Link href="/noticias" className="hover:text-sage transition-colors">
          Noticias
        </Link>

        <span className="w-px h-5 bg-offwhite/20 mx-1" />

        {user ? (
          <>
            <Link href="/app" className="text-sage font-semibold">
              Mi cuenta
            </Link>
            {esAdmin && (
              <Link href="/admin" className="btn-secondary border-offwhite/30 text-offwhite !py-2 !px-4">
                Panel admin
              </Link>
            )}
            <form action={logout}>
              <button type="submit" className="underline text-offwhite/60 text-sm">
                Salir
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="hover:text-sage transition-colors">
              Entrar
            </Link>
            <Link href={hrefInscribete} className="btn-primary !py-2 !px-5 text-sm">
              Inscríbete
            </Link>
          </>
        )}
      </nav>

      <MobileMenu esAdmin={esAdmin} autenticado={!!user} cerrarSesion={logout} />
    </header>
  );
}