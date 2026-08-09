// Ruta: src/components/NivelBadge.tsx
export default function NivelBadge({
  etiqueta,
  xp,
  siguienteUmbral,
}: {
  etiqueta: string;
  xp: number;
  siguienteUmbral: number;
}) {
  const progreso = Math.min(100, Math.round((xp / siguienteUmbral) * 100));

  return (
    <div className="rounded-card bg-navy text-offwhite p-4 inline-block min-w-[220px]">
      <p className="text-sage text-xs uppercase mb-1">Nivel</p>
      <p className="font-display text-xl mb-2">{etiqueta}</p>
      <div className="h-2 bg-offwhite/20 rounded-full overflow-hidden">
        <div className="h-full bg-coral" style={{ width: `${progreso}%` }} />
      </div>
      <p className="text-xs text-offwhite/50 mt-1">
        {xp} / {siguienteUmbral} XP
      </p>
    </div>
  );
}