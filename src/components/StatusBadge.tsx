// Ruta: src/components/StatusBadge.tsx

const ESTILOS = {
  open: "badge-open",
  live: "badge-live",
  closed: "badge-closed",
  pending: "badge-pending",
} as const;

type StatusBadgeTipo = keyof typeof ESTILOS;

interface StatusBadgeProps {
  texto: string;
  tipo: StatusBadgeTipo;
}

export default function StatusBadge({ texto, tipo }: StatusBadgeProps) {
  return (
    <span
      className={ESTILOS[tipo]}
      role="status"
      aria-label={`Estado: ${texto}`}
    >
      {texto}
    </span>
  );
}
