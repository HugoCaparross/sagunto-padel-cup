// Ruta: src/components/StatusBadge.tsx

const ESTILOS = {
  open: "badge-open",
  live: "badge-live",
  closed: "badge-closed",
  pending: "badge-pending",
  neutral: "badge-pending",
  success: "badge-open",
  warning: "badge-pending",
  critical: "badge-live",
} as const;

type StatusBadgeTipo = keyof typeof ESTILOS;

interface StatusBadgeProps {
  texto: string;
  tipo: StatusBadgeTipo;
}

export default function StatusBadge({ texto, tipo }: StatusBadgeProps) {
  const textoNormalizado = texto.trim();

  return (
    <span
      className={ESTILOS[tipo]}
      role="status"
      aria-label={`Estado: ${textoNormalizado}`}
      data-status-type={tipo}
    >
      {textoNormalizado}
    </span>
  );
}
