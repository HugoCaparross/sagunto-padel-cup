import Link from "next/link";
import LogoPatrocinador from "@/components/patrocinio/LogoPatrocinador";
import type { PatrocinadorPublico } from "@/lib/patrocinio/publico";

type Props = {
  patrocinadores: PatrocinadorPublico[];
  nombrePrueba: string;
};

export default function PatrocinadoresHome({ patrocinadores, nombrePrueba }: Props) {
  if (patrocinadores.length === 0) return null;

  const institucionales = patrocinadores.filter((p) => p.tipo === "institucional");
  const comerciales = patrocinadores.filter((p) => p.tipo === "comercial");

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="heading-font text-4xl">Patrocinadores</h2>
          <p className="text-sm text-muted">De {nombrePrueba}</p>
        </div>
        <Link href="/patrocinadores" className="text-sm underline">
          Ver todos
        </Link>
      </div>

      {institucionales.length > 0 && (
        <div className="grid gap-4 rounded-2xl border-2 border-coral p-4 sm:grid-cols-2 lg:grid-cols-3">
          {institucionales.map((p) => (
            <LogoPatrocinador key={p.id} patrocinador={p} grande />
          ))}
        </div>
      )}

      {comerciales.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {comerciales.map((p) => (
            <LogoPatrocinador key={p.id} patrocinador={p} />
          ))}
        </div>
      )}
    </section>
  );
}