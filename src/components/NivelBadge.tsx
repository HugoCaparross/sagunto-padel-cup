// Ruta: src/components/NivelBadge.tsx

interface NivelBadgeProps {
  etiqueta: string;
  xp: number;
  siguienteUmbral: number;
}

export default function NivelBadge({
  etiqueta,
  xp,
  siguienteUmbral,
}: NivelBadgeProps) {
  const xpActual = Math.max(0, Number.isFinite(xp) ? xp : 0);

  const umbral = Math.max(
    0,
    Number.isFinite(siguienteUmbral) ? siguienteUmbral : 0,
  );

  const progreso =
    umbral <= 0
      ? 100
      : Math.min(100, Math.max(0, Math.round((xpActual / umbral) * 100)));

  return (
    <div className="rounded-card bg-navy text-offwhite p-4 inline-block min-w-[220px]">
      <p className="text-sage text-xs uppercase mb-1">Nivel</p>

      <p className="font-display text-xl mb-2">{etiqueta}</p>

      <div
        className="h-2 bg-offwhite/20 rounded-full overflow-hidden"
        role="progressbar"
        aria-label={`Progreso de nivel: ${progreso}%`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progreso}
      >
        <div
          className="h-full bg-coral transition-[width]"
          style={{
            width: `${progreso}%`,
          }}
        />
      </div>

      <p className="text-xs text-offwhite/50 mt-1">
        {xpActual} / {umbral} XP
      </p>
    </div>
  );
}
