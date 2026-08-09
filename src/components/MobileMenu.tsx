// Ruta: src/components/MobileMenu.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function MobileMenu({
  esAdmin,
  autenticado,
  cerrarSesion,
}: {
  esAdmin: boolean;
  autenticado: boolean;
  cerrarSesion: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const primerEnlaceRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }
    if (abierto) {
      document.addEventListener("keydown", onKeyDown);
      primerEnlaceRef.current?.focus();
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [abierto]);

  const enlaces = [
    { href: "/calendario", label: "Calendario" },
    { href: "/ranking", label: "Ranking" },
    { href: "/master-final", label: "Master Final" },
    { href: "/circuito", label: "El Circuito" },
    { href: "/noticias", label: "Noticias" },
  ];

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setAbierto(true)}
        aria-label="Abrir menú"
        aria-expanded={abierto}
        className="p-2"
      >
        <Menu size={26} aria-hidden="true" />
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menú de navegación"
          className="fixed inset-0 z-50 bg-navy text-offwhite flex flex-col p-6"
        >
          <div className="flex justify-between items-center mb-8">
            <span className="font-display text-lg">Menú</span>
            <button onClick={() => setAbierto(false)} aria-label="Cerrar menú" className="p-2">
              <X size={26} aria-hidden="true" />
            </button>
          </div>

          <nav className="flex flex-col gap-1">
            {enlaces.map((e, i) => (
              <Link
                key={e.href}
                href={e.href}
                ref={i === 0 ? primerEnlaceRef : undefined}
                onClick={() => setAbierto(false)}
                className="py-3 text-lg border-b border-offwhite/10"
              >
                {e.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto space-y-3 pt-6">
            {autenticado ? (
              <>
                <Link
                  href="/app"
                  onClick={() => setAbierto(false)}
                  className="btn-secondary w-full border-offwhite/30 text-offwhite justify-center"
                >
                  Mi cuenta
                </Link>
                {esAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setAbierto(false)}
                    className="btn-primary w-full justify-center"
                  >
                    Panel de administración
                  </Link>
                )}
                <button
                  onClick={() => {
                    setAbierto(false);
                    cerrarSesion();
                  }}
                  className="text-sm underline text-offwhite/60 w-full text-center py-2"
                >
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setAbierto(false)}
                  className="btn-secondary w-full border-offwhite/30 text-offwhite justify-center"
                >
                  Entrar
                </Link>
                <Link
                  href="/registro"
                  onClick={() => setAbierto(false)}
                  className="btn-primary w-full justify-center"
                >
                  Inscríbete
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}