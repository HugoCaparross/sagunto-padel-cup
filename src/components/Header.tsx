// Ruta: src/components/Header.tsx

import Image from "next/image";
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
    <header className="absolute inset-x-0 top-0 z-50 w-full bg-transparent px-5 py-4 text-offwhite shadow-none">
      <div className="flex w-full items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-3"
          aria-label="Sagunto Padel Cup — Inicio"
        >
          <Image
            src="/images/brand/logo.png"
            alt=""
            width={42}
            height={42}
            priority
            className="h-[42px] w-[42px] object-contain"
          />

          <span className="font-display text-xl font-semibold tracking-wide text-offwhite">
            Sagunto Padel Cup
          </span>
        </Link>

        <nav
          aria-label="Navegación principal"
          className="hidden items-center gap-6 text-sm sm:flex"
        >
          <Link
            href="/calendario"
            className="font-semibold text-offwhite transition-colors hover:text-sage"
          >
            Calendario
          </Link>

          <Link
            href="/ranking"
            className="text-offwhite transition-colors hover:text-sage"
          >
            Ranking
          </Link>

          <Link
            href="/master-final"
            className="text-offwhite transition-colors hover:text-sage"
          >
            Master Final
          </Link>

          <Link
            href="/circuito"
            className="text-offwhite transition-colors hover:text-sage"
          >
            El Circuito
          </Link>

          <Link
            href="/noticias"
            className="text-offwhite transition-colors hover:text-sage"
          >
            Noticias
          </Link>

          <span
            aria-hidden="true"
            className="mx-1 h-5 w-px bg-offwhite/30"
          />

          {user ? (
            <>
              <Link
                href="/app"
                className="font-semibold text-offwhite transition-colors hover:text-sage"
              >
                Mi cuenta
              </Link>

              {admin && (
                <Link
                  href="/admin"
                  className="btn-secondary !border-offwhite/30 !py-2 !px-4 !text-offwhite"
                >
                  Panel admin
                </Link>
              )}

              <form action={logout}>
                <button
                  type="submit"
                  className="text-sm text-offwhite/70 underline transition-colors hover:text-offwhite"
                >
                  Salir
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-offwhite transition-colors hover:text-sage"
              >
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

        <MobileMenu
          esAdmin={admin}
          autenticado={!!user}
          cerrarSesion={logout}
        />
      </div>
    </header>
  );
}