"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";

type MobileMenuProps = {
  esAdmin: boolean;
  autenticado: boolean;
  cerrarSesion: () => void;
};

const enlaces = [
  {
    href: "/circuito",
    label: "Circuito",
    description: "Descubre cómo funciona el circuito.",
  },
  {
    href: "/calendario",
    label: "Calendario",
    description: "Consulta las próximas pruebas.",
  },
  {
    href: "/ranking",
    label: "Ranking",
    description: "Comprueba tu posición.",
  },
  {
    href: "/master-final",
    label: "Máster Final",
    description: "La gran cita de la temporada.",
  },
  {
    href: "/jugadores",
    label: "Jugadores",
    description: "Conoce a los jugadores del circuito.",
  },
  {
    href: "/noticias",
    label: "Noticias",
    description: "Toda la actualidad del circuito.",
  },
  {
    href: "/contacto",
    label: "Contacto",
    description: "Ponte en contacto con la organización.",
  },
] as const;

export default function MobileMenu({
  esAdmin,
  autenticado,
  cerrarSesion,
}: MobileMenuProps) {
  const [abierto, setAbierto] = useState(false);

  const primerEnlaceRef = useRef<HTMLAnchorElement>(null);
  const botonAbrirRef = useRef<HTMLButtonElement>(null);

  /* ==========================================================
     KEYBOARD / BODY SCROLL
     ========================================================== */

  useEffect(() => {
    if (!abierto) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        cerrarMenu();
      }
    }

    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const timeoutId = window.setTimeout(() => {
      primerEnlaceRef.current?.focus();
    }, 50);

    return () => {
      document.removeEventListener("keydown", onKeyDown);

      window.clearTimeout(timeoutId);

      document.body.style.overflow = previousOverflow;
    };
  }, [abierto]);

  /* ==========================================================
     OPEN / CLOSE
     ========================================================== */

  function abrirMenu() {
    setAbierto(true);
  }

  function cerrarMenu() {
    setAbierto(false);

    window.setTimeout(() => {
      botonAbrirRef.current?.focus();
    }, 0);
  }

  function navegar() {
    setAbierto(false);
  }

  function salir() {
    setAbierto(false);
    cerrarSesion();
  }

  return (
    <div className="mobile-menu">
      {/* ======================================================
          OPEN BUTTON
          ====================================================== */}

      <button
        ref={botonAbrirRef}
        type="button"
        onClick={abrirMenu}
        aria-label="Abrir menú de navegación"
        aria-expanded={abierto}
        aria-controls="mobile-navigation"
        className="mobile-menu__button"
      >
        <Menu
          size={24}
          strokeWidth={2}
          aria-hidden="true"
        />
      </button>

      {/* ======================================================
          MOBILE NAVIGATION
          ====================================================== */}

      {abierto ? (
        <div
          id="mobile-navigation"
          role="dialog"
          aria-modal="true"
          aria-label="Menú de navegación"
          className="mobile-menu__panel"
        >
          {/* ==================================================
              TOP
              ================================================== */}

          <div className="mobile-menu__top">
            <Link
              href="/"
              className="site-brand"
              aria-label="Sagunto Padel Cup — Inicio"
              onClick={navegar}
            >
              <span
                className="site-brand__mark"
                aria-hidden="true"
              >
                <span />
              </span>

              <span className="site-brand__text">
                <strong>SAGUNTO</strong>

                <span>PADEL CUP</span>
              </span>
            </Link>

            <button
              type="button"
              onClick={cerrarMenu}
              aria-label="Cerrar menú de navegación"
              className="mobile-menu__button"
            >
              <X
                size={24}
                strokeWidth={2}
                aria-hidden="true"
              />
            </button>
          </div>

          {/* ==================================================
              NAVEGACIÓN
              ================================================== */}

          <nav
            aria-label="Navegación móvil"
            className="mobile-menu__nav"
          >
            {enlaces.map((enlace, index) => (
              <Link
                key={enlace.href}
                href={enlace.href}
                ref={
                  index === 0
                    ? primerEnlaceRef
                    : undefined
                }
                onClick={navegar}
              >
                <span className="mobile-menu__link-content">
                  <strong>{enlace.label}</strong>

                  <small>{enlace.description}</small>
                </span>

                <ArrowRight
                  size={19}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </Link>
            ))}
          </nav>

          {/* ==================================================
              CUENTA
              ================================================== */}

          <div className="mobile-menu__account">
            {autenticado ? (
              <>
                <div className="mobile-menu__account-intro">
                  <span className="mobile-menu__account-label">
                    Área privada
                  </span>

                  <p>
                    Accede a tu información y a tu
                    experiencia personalizada.
                  </p>
                </div>

                <Link
                  href="/app"
                  onClick={navegar}
                  className="mobile-menu__account-button mobile-menu__account-button--primary"
                >
                  <span>Mi cuenta</span>

                  <ArrowRight
                    size={17}
                    aria-hidden="true"
                  />
                </Link>

                {esAdmin ? (
                  <Link
                    href="/admin"
                    onClick={navegar}
                    className="mobile-menu__account-button mobile-menu__account-button--secondary"
                  >
                    <span>Administración</span>

                    <ArrowRight
                      size={17}
                      aria-hidden="true"
                    />
                  </Link>
                ) : null}

                <button
                  type="button"
                  onClick={salir}
                  className="mobile-menu__logout"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <div className="mobile-menu__account-intro">
                  <span className="mobile-menu__account-label">
                    Área de jugador
                  </span>

                  <p>
                    Crea una cuenta para poder
                    inscribirte en las pruebas y
                    acceder a contenido personalizado.
                  </p>
                </div>

                <Link
                  href="/registro"
                  onClick={navegar}
                  className="mobile-menu__account-button mobile-menu__account-button--primary"
                >
                  <span>Crear cuenta</span>

                  <ArrowRight
                    size={17}
                    aria-hidden="true"
                  />
                </Link>

                <Link
                  href="/login"
                  onClick={navegar}
                  className="mobile-menu__account-button mobile-menu__account-button--secondary"
                >
                  <span>Iniciar sesión</span>

                  <ArrowRight
                    size={17}
                    aria-hidden="true"
                  />
                </Link>
              </>
            )}
          </div>

          {/* ==================================================
              FOOTER
              ================================================== */}

          <div className="mobile-menu__footer">
            <span>SAGUNTO PADEL CUP</span>

            <span>Circuito amateur de pádel</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}