// Ruta: src/components/StatusBadge.tsx

import type { EstadoBadge } from "@/lib/estados";

/* ============================================================
   MAPEO SEMÁNTICO → CLASE CSS
   ============================================================ */

/**
 * Cada tipo semántico tiene su propia clase visual.
 *
 * IMPORTANTE:
 * Los colores NO se definen aquí.
 * Este componente únicamente decide qué clase corresponde
 * a cada tipo de estado.
 *
 * Los colores reales están definidos en globals.css.
 */
const ESTILOS: Record<EstadoBadge, string> = {
  /* ----------------------------------------------------------
     POSITIVOS
     ---------------------------------------------------------- */

  // Estado disponible / acción abierta.
  open: "badge-open",

  // Estado positivo general.
  success: "badge-success",

  /* ----------------------------------------------------------
     ACTIVOS / INFORMACIÓN
     ---------------------------------------------------------- */

  // Competición actualmente activa.
  live: "badge-live",

  // Información / preparación.
  info: "badge-info",

  /* ----------------------------------------------------------
     ATENCIÓN
     ---------------------------------------------------------- */

  // Requiere atención.
  pending: "badge-pending",

  // Advertencia.
  warning: "badge-warning",

  /* ----------------------------------------------------------
     NEUTROS
     ---------------------------------------------------------- */

  // Estado histórico, cerrado o sin acción.
  closed: "badge-closed",

  // Estado neutro.
  neutral: "badge-neutral",

  /* ----------------------------------------------------------
     NEGATIVOS
     ---------------------------------------------------------- */

  // Estado crítico / cancelado / anulado.
  critical: "badge-critical",
};

/* ============================================================
   PROPS
   ============================================================ */

interface StatusBadgeProps {
  texto: string;
  tipo: EstadoBadge;
}

/* ============================================================
   COMPONENTE
   ============================================================ */

export default function StatusBadge({ texto, tipo }: StatusBadgeProps) {
  const textoNormalizado = texto.trim();

  const claseEstado = ESTILOS[tipo] ?? ESTILOS.neutral;

  return (
    <span
      className={claseEstado}
      role="status"
      aria-label={`Estado: ${textoNormalizado}`}
      data-status-type={tipo}
    >
      {textoNormalizado}
    </span>
  );
}
