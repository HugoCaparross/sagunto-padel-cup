// Ruta: src/app/(public)/torneo/[slug]/fotos/page.tsx

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

type SearchParams = {
  dia?: string;
};

type FotoRow = {
  id: string;
  url: string;
  created_at: string | null;
};

export default async function FotosPage({
  params,
  searchParams,
}: {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;

  const filters = await searchParams;

  const supabase = await createClient();

  const { data: torneo } = await supabase
    .from("tournaments")
    .select("id, nombre")
    .eq("slug", slug)
    .maybeSingle();

  if (!torneo) {
    notFound();
  }

  const { data: fotos } = await supabase
    .from("gallery_items")
    .select("id, url, created_at")
    .eq("tournament_id", torneo.id)
    .order("created_at", {
      ascending: false,
    })
    .returns<FotoRow[]>();

  const dias = Array.from(
    new Set(
      (fotos ?? [])
        .map((foto) => foto.created_at?.slice(0, 10))
        .filter((dia): dia is string => Boolean(dia)),
    ),
  ).sort((a, b) => b.localeCompare(a));

  const diaActivo = filters.dia?.trim() ?? "";

  const fotosFiltradas = (fotos ?? []).filter(
    (foto) => !diaActivo || foto.created_at?.slice(0, 10) === diaActivo,
  );

  const fechaDia = (dia: string) =>
    new Intl.DateTimeFormat("es-ES", {
      dateStyle: "long",
    }).format(new Date(`${dia}T12:00:00`));

  return (
    <main className="mx-auto max-w-5xl px-5 py-12">
      <header className="mb-8">
        <h1 className="font-display text-3xl">Fotos</h1>

        <p className="mt-2 text-navy/70">{torneo.nombre}</p>
      </header>

      {dias.length ? (
        <nav
          aria-label="Filtrar fotografías por jornada"
          className="mb-8 overflow-x-auto"
        >
          <div className="flex min-w-max gap-2">
            <Link
              href={`/torneo/${slug}/fotos`}
              className={`rounded-full px-3 py-2 text-sm ${
                !diaActivo ? "bg-navy text-offwhite" : "bg-navy/5 text-navy/70"
              }`}
            >
              Todas
            </Link>

            {dias.map((dia) => (
              <Link
                key={dia}
                href={`/torneo/${slug}/fotos?dia=${encodeURIComponent(dia)}`}
                className={`rounded-full px-3 py-2 text-sm ${
                  diaActivo === dia
                    ? "bg-navy text-offwhite"
                    : "bg-navy/5 text-navy/70"
                }`}
              >
                {fechaDia(dia)}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}

      {!fotos?.length ? (
        <section
          role="status"
          className="rounded-card bg-navy/5 p-6 text-sm text-navy/70"
        >
          Aún no hay fotos publicadas.
        </section>
      ) : !fotosFiltradas.length ? (
        <section
          role="status"
          className="rounded-card bg-navy/5 p-6 text-sm text-navy/70"
        >
          No hay fotografías para la jornada seleccionada.
        </section>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {fotosFiltradas.map((foto, index) => (
            <figure
              key={foto.id}
              className="overflow-hidden rounded-card bg-navy/5"
            >
              <a
                href={foto.url}
                target="_blank"
                rel="noreferrer"
                aria-label={`Abrir fotografía ${index + 1} en tamaño completo`}
                className="block"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={foto.url}
                  alt={`Fotografía del torneo ${index + 1}`}
                  loading={index < 4 ? "eager" : "lazy"}
                  className="aspect-square w-full object-cover transition-transform duration-200 hover:scale-[1.02]"
                />
              </a>

              <figcaption className="flex items-center justify-between gap-2 px-3 py-2">
                <span className="text-xs text-navy/55">
                  {foto.created_at
                    ? fechaDia(foto.created_at.slice(0, 10))
                    : "Material del torneo"}
                </span>

                <a
                  href={foto.url}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 text-xs font-semibold text-coral underline underline-offset-4"
                >
                  Ampliar
                </a>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      <p className="mt-6 text-xs text-navy/45">
        Las fotografías se muestran únicamente cuando han sido publicadas por la
        organización.
      </p>
    </main>
  );
}
