import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listarInscritos } from "@/actions/inscritos";
import AgendaPartidos from "@/components/pruebas/AgendaPartidos";
import GoogleIcon from "@/components/ui/GoogleIcon";
import {
  CATEGORIAS,
  ETIQUETAS_CATEGORIA,
  ETIQUETAS_ESTADO_PRUEBA,
} from "@/lib/constantes";
import { euros, fechaLarga, fechaRangoPrueba } from "@/lib/formato";
import { formatoFechaInscripcion } from "@/lib/pruebas/fechas-clave";
import {
  cargarPartidosPublicos,
  listarPruebasPublicas,
} from "@/lib/pruebas/publico";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const prueba = (await listarPruebasPublicas()).find((p) => p.slug === slug);
  return { title: prueba?.nombre ?? "Prueba" };
}

export default async function PaginaPrueba({ params }: Props) {
  const { slug } = await params;

  const prueba = (await listarPruebasPublicas()).find((p) => p.slug === slug);
  if (!prueba) notFound();

  const [partidos, inscritos] = await Promise.all([
    cargarPartidosPublicos(prueba.id),
    listarInscritos({ pruebaId: prueba.id }),
  ]);

  const inscribible = prueba.estado === "abierta";

  return (
    <main className="container space-y-12 py-12">
      <nav className="text-sm text-[var(--color-muted)]">
        <Link href="/calendario" className="hover:underline">
          Calendario
        </Link>
        <span> / {prueba.nombre}</span>
      </nav>

      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded bg-[var(--color-navy)] px-2 py-1 text-sm text-white">
            {ETIQUETAS_ESTADO_PRUEBA[prueba.estado]}
          </span>
          {prueba.esMaster && (
            <span className="rounded bg-[var(--color-warning-bg)] px-2 py-1 text-sm text-[var(--color-warning)]">Máster</span>
          )}
        </div>

        <h1 className="heading-font text-6xl">{prueba.nombre}</h1>

        <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-[var(--color-muted)]">Día del torneo</dt>
            <dd className="font-medium">
              {fechaRangoPrueba(prueba.fechaInicio, prueba.fechaFin)}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--color-muted)]">Horario</dt>
            <dd className="font-medium">
              {prueba.horaInicio} – {prueba.horaFin}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--color-muted)]">Sede</dt>
            <dd className="font-medium">
              {prueba.sedeUrl ? (
                <a href={prueba.sedeUrl} target="_blank" rel="noopener noreferrer" className="underline">
                  {prueba.sede}
                </a>
              ) : (
                prueba.sede
              )}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--color-muted)]">Precio por pareja</dt>
            <dd className="font-medium">
              {euros(prueba.precioCentimos)} <span className="font-normal">en efectivo el primer día</span>
            </dd>
          </div>
        </dl>

        <section aria-labelledby="fechas-clave-titulo" className="rounded-xl border border-border bg-[var(--color-fondo)] p-5 sm:p-6">
          <h2 id="fechas-clave-titulo" className="mb-4 font-semibold">Fechas clave</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-border bg-white p-4 shadow-card">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--color-success)]"><GoogleIcon name="event_available" />Apertura de inscripciones</p>
              {prueba.inscripcionesAbrenAt ? <time dateTime={prueba.inscripcionesAbrenAt} className="block font-semibold text-ink">{formatoFechaInscripcion(prueba.inscripcionesAbrenAt)}</time> : <p className="font-semibold text-ink">{formatoFechaInscripcion(null)}</p>}
              <p className="mt-1 text-sm text-muted">{prueba.inscripcionesAbrenAt ? "Fecha indicada por la organización" : "La organización la anunciará"}</p>
            </div>
            <div className="rounded-lg border border-border bg-white p-4 shadow-card">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-coral-texto"><GoogleIcon name="event" />Cierre de inscripciones</p>
              {prueba.inscripcionesCierranAt ? <time dateTime={prueba.inscripcionesCierranAt} className="block font-semibold text-ink">{formatoFechaInscripcion(prueba.inscripcionesCierranAt)}</time> : <p className="font-semibold text-ink">{formatoFechaInscripcion(null)}</p>}
              <p className="mt-1 text-sm text-muted">{prueba.inscripcionesCierranAt ? "Fecha indicada por la organización" : "La organización la anunciará"}</p>
            </div>
            <div className="rounded-lg border border-border bg-white p-4 shadow-card">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-navy"><GoogleIcon name="sports_tennis" />Día del torneo</p>
              <p className="font-semibold text-ink">{fechaRangoPrueba(prueba.fechaInicio, prueba.fechaFin)}</p>
              <p className="mt-1 text-sm text-muted">Fechas del torneo</p>
            </div>
          </div>
        </section>

        {inscribible ? (
          <Link
            href={`/inscribirse/${prueba.slug}`}
            className="btn btn-primario btn-lg"
          >
            Inscribirme
          </Link>
        ) : (
          <p className="text-sm text-[var(--color-muted)]">
            {prueba.estado === "proxima"
              ? "Las inscripciones se abrirán próximamente."
              : "Las inscripciones de esta prueba ya están cerradas."}
          </p>
        )}
      </header>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="heading-font text-3xl">Categorías</h2>
          <p className="text-sm text-[var(--color-muted)]">
            {prueba.plazasMaximas} parejas máximo · {prueba.plazasLibres} plazas libres
          </p>
        </div>
        <ul className="flex flex-wrap gap-2 text-sm">
          {CATEGORIAS.filter((c) => prueba.categorias.includes(c)).map((c) => (
            <li key={c} className="rounded-full bg-white px-4 py-1.5 ring-1 ring-[var(--color-border)]">
              {ETIQUETAS_CATEGORIA[c]}
            </li>
          ))}
        </ul>
        <p className="text-sm text-[var(--color-muted)]">
          Una categoría se disputa si tiene al menos 3 parejas inscritas.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="heading-font text-3xl">Inscritos</h2>
        {inscritos.ok ? (
          inscritos.filas.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">Todavía no hay parejas inscritas.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {CATEGORIAS.filter((c) => prueba.categorias.includes(c)).map((c) => {
                const lista = inscritos.filas.filter((f) => f.categoria === c);
                return (
                  <div key={c} className="rounded-xl bg-white p-5 ring-1 ring-[var(--color-border)]">
                    <h3 className="mb-3 font-semibold">
                      {ETIQUETAS_CATEGORIA[c]}{" "}
                      <span className="text-sm font-normal text-[var(--color-muted)]">({lista.length})</span>
                    </h3>
                    {lista.length === 0 ? (
                      <p className="text-sm text-[var(--color-muted)]">Sin parejas todavía.</p>
                    ) : (
                      <ul className="divide-y divide-[var(--color-border)] text-sm">
                        {lista.map((f) => (
                          <li key={f.inscripcionId} className="flex justify-between py-2">
                            <span>{f.texto}</span>
                            {!f.ocupaPlaza && (
                              <span className="text-sm text-[var(--color-warning)]">Lista de espera</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <p className="text-sm text-[var(--color-muted)]">{inscritos.error}</p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="heading-font text-3xl">Partidos</h2>
        <AgendaPartidos partidos={partidos} />
      </section>
    </main>
  );
}
