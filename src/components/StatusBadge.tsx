// Ruta: src/components/StatusBadge.tsx
const ESTILOS = {
  open: "badge-open",
  live: "badge-live",
  closed: "badge-closed",
  pending: "badge-pending",
} as const;

export default function StatusBadge({
  texto,
  tipo,
}: {
  texto: string;
  tipo: "open" | "live" | "closed" | "pending";
}) {
  return <span className={ESTILOS[tipo]}>{texto}</span>;
}