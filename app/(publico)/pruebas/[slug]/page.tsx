import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listarInscritos } from "@/actions/inscritos";
import AgendaPartidos from "@/components/pruebas/AgendaPartidos";
import {
  CATEGORIAS,
  ETIQUETAS_CATEGORIA,
  ETIQUETAS_ESTADO_PRUEBA,
} from "@/lib/constantes";
import { euros, fechaLarga } from "@/lib/formato";
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
      <nav className="text-sm text-[#68737D]">
        <Link href="/calendario" className="hover:underline">
          Calendario
        </Link>
        <span> / {prueba.nombre}</span>
      </nav>

      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded bg-[#0D1B2A] px-2 py-1 text-xs text-white">
            {ETIQUETAS_ESTADO_PRUEBA[prueba.estado]}
          </span>
          {prueba.esMaster && (
            <span className="rounded bg-[#FFF4DE] px-2 py-1 text-xs text-[#B77912]">Máster</span>
          )}
        </div>

        <h1 className="heading-font text-6xl">{prueba.nombre}</h1>

        <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-[#68737D]">Fechas</dt>
            <dd className="font-medium">
              {fechaLarga(prueba.fechaInicio)}
              {prueba.fechaFin !== prueba.fechaInicio && ` – ${fechaLarga(prueba.fechaFin)}`}
            </dd>
          </div>
          <div>
            <dt className="text-[#68737D]">Horario</dt>
            <dd className="font-medium">
              {prueba.horaInicio} – {prueba.horaFin}
            </dd>
          </div>
          <div>
            <dt className="text-[#68737D]">Sede</dt>
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
            <dt className="text-[#68737D]">Precio por pareja</dt>
            <dd className="font-medium">
              {euros(prueba.precioCentimos)} <span className="font-normal">en efectivo el primer día</span>
            </dd>
          </div>
        </dl>

        {inscribible ? (
          <Link
            href={`/inscribirse/${prueba.slug}`}
            className="inline-block rounded-lg bg-[#F0443A] px-5 py-3 text-sm font-medium text-white"
          >
            Inscribirme
          </Link>
        ) : (
          <p className="text-sm text-[#68737D]">
            {prueba.estado === "proxima"
              ? "Las inscripciones se abrirán próximamente."
              : "Las inscripciones de esta prueba ya están cerradas."}
          </p>
        )}
      </header>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="heading-font text-3xl">Categorías</h2>
          <p className="text-sm text-[#68737D]">
            {prueba.plazasMaximas} parejas máximo · {prueba.plazasLibres} plazas libres
          </p>
        </div>
        <ul className="flex flex-wrap gap-2 text-sm">
          {CATEGORIAS.filter((c) => prueba.categorias.includes(c)).map((c) => (
            <li key={c} className="rounded-full bg-white px-4 py-1.5 ring-1 ring-[#D5D9DC]">
              {ETIQUETAS_CATEGORIA[c]}
            </li>
          ))}
        </ul>
        <p className="text-xs text-[#68737D]">
          Una categoría se disputa si tiene al menos 3 parejas inscritas.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="heading-font text-3xl">Inscritos</h2>
        {inscritos.ok ? (
          inscritos.filas.length === 0 ? (
            <p className="text-sm text-[#68737D]">Todavía no hay parejas inscritas.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {CATEGORIAS.filter((c) => prueba.categorias.includes(c)).map((c) => {
                const lista = inscritos.filas.filter((f) => f.categoria === c);
                return (
                  <div key={c} className="rounded-xl bg-white p-5 ring-1 ring-[#D5D9DC]">
                    <h3 className="mb-3 font-semibold">
                      {ETIQUETAS_CATEGORIA[c]}{" "}
                      <span className="text-sm font-normal text-[#68737D]">({lista.length})</span>
                    </h3>
                    {lista.length === 0 ? (
                      <p className="text-sm text-[#68737D]">Sin parejas todavía.</p>
                    ) : (
                      <ul className="divide-y divide-[#D5D9DC] text-sm">
                        {lista.map((f) => (
                          <li key={f.inscripcionId} className="flex justify-between py-2">
                            <span>{f.texto}</span>
                            {!f.ocupaPlaza && (
                              <span className="text-xs text-[#B77912]">Lista de espera</span>
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
          <p className="text-sm text-[#68737D]">{inscritos.error}</p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="heading-font text-3xl">Partidos</h2>
        <AgendaPartidos partidos={partidos} />
      </section>
    </main>
  );
}