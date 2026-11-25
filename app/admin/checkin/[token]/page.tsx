import { ETIQUETAS_CATEGORIA, ETIQUETAS_ESTADO_INSCRIPCION } from "@/lib/constantes";
import { obtenerFichaCheckin } from "@/actions/checkin";
import BotonCheckin from "@/components/checkin/BotonCheckin";

type Props = {
  params: Promise<{ token: string }>;
};

export default async function PaginaCheckin({ params }: Props) {
  const { token } = await params;
  const res = await obtenerFichaCheckin({ token });

  if (!res.ok) {
    return (
      <main className="p-6">
        <p className="text-[var(--color-danger)]">{res.error}</p>
      </main>
    );
  }

  const f = res.datos;

  return (
    <main className="mx-auto max-w-lg space-y-6 p-6">
      <header>
        <p className="text-xs uppercase text-[var(--color-muted)]">Check-in</p>
        <h1 className="text-2xl font-semibold">{f.pruebaNombre}</h1>
        <p className="text-sm text-[var(--color-muted)]">
          {ETIQUETAS_CATEGORIA[f.categoria]}
        </p>
      </header>

      <section className="rounded-xl bg-white p-4 ring-1 ring-[var(--color-border)]">
        <p className="text-lg font-medium">{f.texto}</p>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Estado: {ETIQUETAS_ESTADO_INSCRIPCION[f.estado]}
        </p>
      </section>

      <BotonCheckin token={token} ficha={f} />
    </main>
  );
}