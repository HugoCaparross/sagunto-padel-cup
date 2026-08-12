// Ruta: src/components/Header.tsx — sustituye entero al archivo actual

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(public)/login/actions";
import { esAdmin } from "@/lib/admin";
import MobileMenu from "@/components/MobileMenu";

export default async function Header() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = await esAdmin(user?.id);

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
      <Link
        href="/"
        className="font-display text-lg tracking-wide"
        aria-label="Sagunto Padel Cup — Inicio"
      >
        Sagunto Padel Cup
      </Link>

      <nav
        aria-label="Navegación principal"
        className="hidden sm:flex items-center gap-6 text-sm"
      >
        <Link href="/calendario" className="hover:text-sage transition-colors">
          Calendario
        </Link>

        <Link href="/ranking" className="hover:text-sage transition-colors">
          Ranking
        </Link>

        <Link
          href="/master-final"
          className="hover:text-sage transition-colors"
        >
          Master Final
        </Link>

        <Link href="/circuito" className="hover:text-sage transition-colors">
          El Circuito
        </Link>

        <Link href="/noticias" className="hover:text-sage transition-colors">
          Noticias
        </Link>

        <span aria-hidden="true" className="w-px h-5 bg-offwhite/20 mx-1" />

        {user ? (
          <>
            <Link href="/app" className="text-sage font-semibold">
              Mi cuenta
            </Link>

            {admin && (
              <Link
                href="/admin"
                className="btn-secondary border-offwhite/30 text-offwhite !py-2 !px-4"
              >
                Panel admin
              </Link>
            )}

            <form action={logout}>
              <button
                type="submit"
                className="underline text-offwhite/60 text-sm"
              >
                Salir
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="hover:text-sage transition-colors">
              Entrar
            </Link>

            <Link
              href={hrefInscribete}
              className="btn-primary !py-2 !px-5 text-sm"
            >
              Inscríbete
            </Link>
          </>
        )}
      </nav>

      <MobileMenu esAdmin={admin} autenticado={!!user} cerrarSesion={logout} />
    </header>
  );
}
