// Ruta: src/components/NotificacionesList.tsx

"use client";

import { useState } from "react";
import { marcarLeida } from "@/app/(private)/app/notificaciones/actions";

type Notificacion = {
  id: string;
  tipo: string;
  contenido: string | null;
  leido: boolean;
  fecha_envio: string;
};

interface NotificacionesListProps {
  iniciales: Notificacion[];
}

export default function NotificacionesList({
  iniciales,
}: NotificacionesListProps) {
  const [lista, setLista] = useState<Notificacion[]>(iniciales);

  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  async function marcar(id: string) {
    if (procesandoId !== null) {
      return;
    }

    const anterior = lista.find((notificacion) => notificacion.id === id);

    if (!anterior || anterior.leido) {
      return;
    }

    setProcesandoId(id);
    setError(null);

    setLista((prev) =>
      prev.map((notificacion) =>
        notificacion.id === id
          ? {
              ...notificacion,
              leido: true,
            }
          : notificacion,
      ),
    );

    try {
      const resultado = await marcarLeida(id);

      if (!resultado.ok) {
        setLista((prev) =>
          prev.map((notificacion) =>
            notificacion.id === id ? anterior : notificacion,
          ),
        );

        setError(
          resultado.error ??
            "No se ha podido marcar la notificación como leída.",
        );
      }
    } catch (actionError) {
      console.error(
        "[NotificacionesList] Error marcando notificación:",
        actionError,
      );

      setLista((prev) =>
        prev.map((notificacion) =>
          notificacion.id === id ? anterior : notificacion,
        ),
      );

      setError("Ha ocurrido un error inesperado. Inténtalo de nuevo.");
    } finally {
      setProcesandoId(null);
    }
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p role="alert" className="text-sm text-coral">
          {error}
        </p>
      ) : null}

      <ul className="space-y-2">
        {lista.map((n) => {
          const procesando = procesandoId === n.id;

          return (
            <li key={n.id}>
              {n.leido ? (
                <div className="rounded-card px-5 py-4 bg-navy/5">
                  <p className="text-sm">{n.contenido}</p>

                  <p className="text-xs text-navy/50 mt-1">
                    {new Date(n.fecha_envio).toLocaleDateString("es-ES")}
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => marcar(n.id)}
                  disabled={procesandoId !== null}
                  className="w-full rounded-card px-5 py-4 cursor-pointer bg-sage/20 border border-sage text-left transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label={`Marcar como leída: ${
                    n.contenido ?? "Notificación"
                  }`}
                >
                  <p className="text-sm">{n.contenido}</p>

                  <p className="text-xs text-navy/50 mt-1">
                    {new Date(n.fecha_envio).toLocaleDateString("es-ES")}
                  </p>

                  {procesando ? (
                    <p className="text-xs text-navy/50 mt-2">Guardando...</p>
                  ) : null}
                </button>
              )}
            </li>
          );
        })}

        {!lista.length ? (
          <li>
            <p className="text-navy/70">No tienes notificaciones.</p>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
