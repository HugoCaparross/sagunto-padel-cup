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

export default function NotificacionesList({ iniciales }: { iniciales: Notificacion[] }) {
  const [lista, setLista] = useState(iniciales);

  async function marcar(id: string) {
    setLista((prev) => prev.map((n) => (n.id === id ? { ...n, leido: true } : n)));
    await marcarLeida(id);
  }

  return (
    <ul className="space-y-2">
      {lista.map((n) => (
        <li
          key={n.id}
          onClick={() => !n.leido && marcar(n.id)}
          className={`rounded-card px-5 py-4 cursor-pointer ${
            n.leido ? "bg-navy/5" : "bg-sage/20 border border-sage"
          }`}
        >
          <p className="text-sm">{n.contenido}</p>
          <p className="text-xs text-navy/50 mt-1">
            {new Date(n.fecha_envio).toLocaleDateString("es-ES")}
          </p>
        </li>
      ))}
      {!lista.length && <p className="text-navy/70">No tienes notificaciones.</p>}
    </ul>
  );
}