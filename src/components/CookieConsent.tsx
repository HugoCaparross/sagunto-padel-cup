// Ruta: src/components/CookieConsent.tsx
"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { getConsent, setConsent, type ConsentValue } from "@/lib/consent";
import { Analytics } from "@vercel/analytics/react";

export default function CookieConsent() {
  const [selection, setSelection] = useState<ConsentValue | null>(null);
  const storedConsent = useSyncExternalStore(
    () => () => {},
    getConsent,
    () => null
  );
  const consent = selection ?? storedConsent;
  const visible = consent === null;

  function handle(value: ConsentValue) {
    setConsent(value);
    setSelection(value);
  }

  return (
    <>
      {consent === "accepted" && <Analytics />}

      {visible && (
        <div
          role="dialog"
          aria-label="Consentimiento de cookies"
          className="fixed bottom-0 left-0 right-0 z-50 bg-navy text-offwhite px-5 py-4 sm:flex sm:items-center sm:justify-between gap-4"
        >
          <p className="text-sm mb-3 sm:mb-0">
            Usamos cookies para el funcionamiento básico de la web y, si lo
            aceptas, para saber cuánta gente nos visita.{" "}
            <Link href="/legal/cookies" className="underline text-sage">
              Más información
            </Link>
          </p>
          <div className="flex gap-3 shrink-0">
            <button
              onClick={() => handle("rejected")}
              className="px-4 py-2 rounded-card border border-offwhite text-sm font-semibold"
            >
              Rechazar
            </button>
            <button
              onClick={() => handle("accepted")}
              className="px-4 py-2 rounded-card bg-coral text-offwhite text-sm font-semibold"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
