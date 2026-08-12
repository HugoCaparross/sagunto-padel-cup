import Link from "next/link";
import { ArrowRight } from "lucide-react";

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

  /*
   * Buscamos únicamente la primera prueba con
   * inscripciones abiertas para convertir el CTA
   * principal del Header en una acción útil.
   */
  const { data: torneoAbierto } = await supabase
    .from("tournaments")
    .select("slug, nombre, fecha_inicio")
    .eq("estado", "inscripciones_abiertas")
    .order("fecha_inicio", {
      ascending: true,
    })
    .limit(1)
    .maybeSingle();

  const hrefInscribete = torneoAbierto
    ? `/torneo/${torneoAbierto.slug}/inscribirse`
    : "/calendario";

  return (
    <header className="site-header">
      <div className="site-header__inner">
        {/* ==================================================
            LOGO / WORDMARK
            ================================================== */}

        <Link
          href="/"
          className="site-brand"
          aria-label="Sagunto Padel Cup — Inicio"
        >
          <span className="site-brand__mark" aria-hidden="true">
            <span />
          </span>

          <span className="site-brand__text">
            <strong>SAGUNTO</strong>
            <span>PADEL CUP</span>
          </span>
        </Link>

        {/* ==================================================
            NAVEGACIÓN PRINCIPAL
            ================================================== */}

        <nav aria-label="Navegación principal" className="site-nav">
          <Link href="/circuito">Circuito</Link>

          <Link href="/calendario">Calendario</Link>

          <Link href="/ranking">Ranking</Link>

          <Link href="/master-final">Máster</Link>

          <Link href="/jugadores">Jugadores</Link>

          <Link href="/noticias">Noticias</Link>

          <Link href="/contacto">Contacto</Link>
        </nav>

        {/* ==================================================
            ACCIONES
            ================================================== */}

        <div className="site-header__actions">
          {user ? (
            <>
              <Link href="/app" className="site-account-link">
                Mi cuenta
              </Link>

              {admin ? (
                <Link href="/admin" className="site-account-link">
                  Admin
                </Link>
              ) : null}

              <form action={logout}>
                <button type="submit" className="site-account-link">
                  Salir
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="site-login">
                Iniciar sesión
              </Link>

              <Link href={hrefInscribete} className="site-register">
                <span>Inscribirse</span>

                <ArrowRight size={15} strokeWidth={2.2} aria-hidden="true" />
              </Link>
            </>
          )}
        </div>

        {/* ==================================================
            MOBILE MENU
            ================================================== */}

        <MobileMenu
          esAdmin={admin}
          autenticado={!!user}
          cerrarSesion={logout}
        />
      </div>
    </header>
  );
}
