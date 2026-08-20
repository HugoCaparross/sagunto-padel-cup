// Ruta: src/app/(public)/calendario/page.tsx

import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  MapPin,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import {
  ESTADO_TORNEO,
  ESTADO_TORNEO_BADGE,
  formatearFecha,
} from "@/lib/estados";
import StatusBadge from "@/components/StatusBadge";

export const metadata = {
  title: "Calendario | Sagunto Padel Cup",
  description:
    "Consulta todas las pruebas del calendario de Sagunto Padel Cup, sus fechas, categorías, clubes y estado de inscripción.",
};

type SearchParams = {
  estado?: string;
  categoria?: string;
};

type Props = {
  searchParams: Promise<SearchParams>;
};

const ESTADOS_VISIBLES = [
  "publicado",
  "inscripciones_abiertas",
  "inscripciones_cerradas",
  "en_preparacion",
  "en_juego",
  "finalizado",
  "cancelado",
  "archivado",
] as const;

type TournamentCategory = {
  categories: {
    id?: string;
    nombre?: string;
  } | null;
  cupo_maximo: number | null;
};

type Tournament = {
  id: string;
  nombre: string;
  slug: string;
  estado: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  club_id: string | null;
  clubs: {
    nombre?: string;
  } | null;
  tournament_categories: TournamentCategory[];
};

function getDateParts(date: string) {
  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return {
      day: "--",
      month: "--",
      year: "",
    };
  }

  return {
    day: new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
    }).format(parsedDate),
    month: new Intl.DateTimeFormat("es-ES", {
      month: "short",
    })
      .format(parsedDate)
      .replace(".", "")
      .toUpperCase(),
    year: new Intl.DateTimeFormat("es-ES", {
      year: "numeric",
    }).format(parsedDate),
  };
}

function getTournamentCategories(torneo: Tournament) {
  return torneo.tournament_categories
    .map((item) => item.categories?.nombre)
    .filter((nombre): nombre is string => Boolean(nombre));
}

function getTournamentCapacity(torneo: Tournament) {
  return torneo.tournament_categories.reduce(
    (total, item) => total + (Number(item.cupo_maximo) || 0),
    0,
  );
}

function getStatusLabel(estado: string) {
  return ESTADO_TORNEO[estado] ?? estado;
}

function getStatusBadgeType(estado: string) {
  return ESTADO_TORNEO_BADGE[estado] ?? "pending";
}

function isUpcomingTournament(torneo: Tournament) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(`${torneo.fecha_inicio}T00:00:00`);

  return (
    !Number.isNaN(start.getTime()) &&
    start >= today &&
    !["cancelado", "archivado", "finalizado"].includes(torneo.estado)
  );
}

export default async function CalendarioPage({ searchParams }: Props) {
  const filters = await searchParams;

  const estadoActivo = filters.estado ?? "todos";
  const categoriaActiva = filters.categoria?.trim().toLowerCase() ?? "";

  const supabase = await createClient();

  const [
    { data: torneosData },
    { data: categoriasData },
    { data: userData },
  ] = await Promise.all([
    supabase
      .from("tournaments")
      .select(
        "id, nombre, slug, estado, fecha_inicio, fecha_fin, club_id, clubs(nombre), tournament_categories(categories(id, nombre), cupo_maximo)",
      )
      .neq("estado", "borrador")
      .order("fecha_inicio", { ascending: true }),

    supabase
      .from("categories")
      .select("id, nombre")
      .order("nombre", { ascending: true }),

    supabase.auth.getUser(),
  ]);

  const torneos = (torneosData ?? []) as Tournament[];

  const categorias = categoriasData ?? [];

  const torneosFiltrados = torneos.filter((torneo) => {
    if (
      estadoActivo !== "todos" &&
      !ESTADOS_VISIBLES.includes(
        estadoActivo as (typeof ESTADOS_VISIBLES)[number],
      )
    ) {
      return false;
    }

    if (estadoActivo !== "todos" && torneo.estado !== estadoActivo) {
      return false;
    }

    if (!categoriaActiva) {
      return true;
    }

    return torneo.tournament_categories.some((item) => {
      const category = item.categories;

      return (
        category?.id === filters.categoria ||
        category?.nombre?.trim().toLowerCase() === categoriaActiva
      );
    });
  });

  const upcomingTournament =
    torneos.find(isUpcomingTournament) ?? torneos[0] ?? null;

  const totalTorneos = torneos.length;

  const torneosAbiertos = torneos.filter(
    (torneo) => torneo.estado === "inscripciones_abiertas",
  ).length;

  const torneosFinalizados = torneos.filter(
    (torneo) => torneo.estado === "finalizado",
  ).length;

  const user = userData.user;

  return (
    <main className="calendar-page">
      {/* ======================================================
          HERO
          ====================================================== */}

      <section className="calendar-hero">
        <div className="calendar-container calendar-hero__inner">
          <div>
            <p className="calendar-kicker">
              <CalendarDays size={14} aria-hidden="true" />
              Temporada 2026 / 2027
            </p>

            <h1>Calendario</h1>

            <p>
              Consulta todas las pruebas del circuito, descubre cuándo y dónde
              se juega cada torneo y accede directamente a toda la información
              de cada competición.
            </p>
          </div>

          <div
            className="calendar-hero__line"
            aria-hidden="true"
          />
        </div>
      </section>

      {/* ======================================================
          CONTENIDO
          ====================================================== */}

      <div className="calendar-container calendar-content">
        {/* ====================================================
            FILTROS
            ==================================================== */}

        <section
          className="calendar-filters"
          aria-label="Filtros del calendario"
        >
          <div className="calendar-filter">
            <label htmlFor="calendario-temporada">Temporada</label>

            <div className="calendar-filter__value">
              <CalendarDays size={16} aria-hidden="true" />
              <span>2026 / 2027</span>
            </div>
          </div>

          <form
            method="get"
            className="calendar-filter-form"
          >
            <div className="calendar-filter">
              <label htmlFor="calendario-estado">
                Estado
              </label>

              <select
                id="calendario-estado"
                name="estado"
                defaultValue={estadoActivo}
              >
                <option value="todos">Todos los estados</option>

                {ESTADOS_VISIBLES.map((estado) => (
                  <option key={estado} value={estado}>
                    {ESTADO_TORNEO[estado] ?? estado}
                  </option>
                ))}
              </select>
            </div>

            <div className="calendar-filter">
              <label htmlFor="calendario-categoria">
                Categoría
              </label>

              <select
                id="calendario-categoria"
                name="categoria"
                defaultValue={filters.categoria ?? ""}
              >
                <option value="">Todas las categorías</option>

                {categorias.map((categoria) => (
                  <option
                    key={categoria.id}
                    value={categoria.id}
                  >
                    {categoria.nombre}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="calendar-filter-submit"
            >
              Aplicar filtros
            </button>
          </form>

          {estadoActivo !== "todos" || categoriaActiva ? (
            <Link
              href="/calendario"
              className="calendar-clear-filter"
            >
              Limpiar filtros
            </Link>
          ) : null}
        </section>

        {/* ====================================================
            RESUMEN
            ==================================================== */}

        <section
          className="calendar-summary"
          aria-label="Resumen de temporada"
        >
          <div>
            <Trophy size={20} aria-hidden="true" />

            <strong>{totalTorneos}</strong>

            <span>Pruebas</span>
          </div>

          <div>
            <CalendarDays size={20} aria-hidden="true" />

            <strong>{torneosAbiertos}</strong>

            <span>Inscripciones abiertas</span>
          </div>

          <div>
            <Clock3 size={20} aria-hidden="true" />

            <strong>{torneosFinalizados}</strong>

            <span>Finalizadas</span>
          </div>

          <div className="calendar-summary__next">
            <span>Próxima cita</span>

            <strong>
              {upcomingTournament
                ? formatearFecha(upcomingTournament.fecha_inicio)
                : "Próximamente"}
            </strong>
          </div>
        </section>

        {/* ====================================================
            CUENTA
            ==================================================== */}

        <section
          className={`calendar-account-callout${user ? " calendar-account-callout--logged" : ""
            }`}
          aria-label="Cuenta de usuario"
        >
          <div className="calendar-account-callout__icon">
            {user ? (
              <ShieldCheck
                size={22}
                aria-hidden="true"
              />
            ) : (
              <Users
                size={22}
                aria-hidden="true"
              />
            )}
          </div>

          <div>
            <p className="calendar-account-callout__eyebrow">
              {user
                ? "Área de jugador"
                : "Da el siguiente paso"}
            </p>

            <h2>
              {user
                ? "Tu cuenta está preparada para acceder al área privada."
                : "Crea tu cuenta para disfrutar de toda la experiencia."}
            </h2>

            <p>
              {user
                ? "Desde tu área privada podrás consultar tu información personal, tus participaciones y el contenido asociado a tus torneos."
                : "El calendario es público, pero necesitas una cuenta para inscribirte en pruebas y acceder al contenido personalizado de jugador."}
            </p>
          </div>

          <div className="calendar-account-callout__actions">
            {user ? (
              <Link
                href="/app"
                className="btn-primary"
              >
                Mi área de jugador
                <ChevronRight
                  size={16}
                  aria-hidden="true"
                />
              </Link>
            ) : (
              <>
                <Link
                  href="/registro"
                  className="btn-primary"
                >
                  Crear cuenta
                  <ChevronRight
                    size={16}
                    aria-hidden="true"
                  />
                </Link>

                <Link
                  href="/login"
                  className="btn-secondary"
                >
                  Iniciar sesión
                </Link>
              </>
            )}
          </div>
        </section>

        {/* ====================================================
            PRÓXIMA PRUEBA
            ==================================================== */}

        {upcomingTournament ? (
          <section className="calendar-section">
            <div className="calendar-section-heading">
              <div>
                <p className="calendar-section-kicker">
                  Próxima prueba
                </p>

                <h2>La siguiente cita</h2>
              </div>

              <span>Calendario oficial</span>
            </div>

            {(() => {
              const date = getDateParts(
                upcomingTournament.fecha_inicio,
              );

              const club = upcomingTournament.clubs;

              const tournamentCategories =
                getTournamentCategories(
                  upcomingTournament,
                );

              const capacity =
                getTournamentCapacity(
                  upcomingTournament,
                );

              return (
                <article className="calendar-featured">
                  <Link
                    href={`/torneo/${upcomingTournament.slug}`}
                    className="calendar-featured__date"
                    aria-label={`Ver ${upcomingTournament.nombre}`}
                  >
                    <span>{date.day}</span>

                    <strong>{date.month}</strong>

                    <small>{date.year}</small>
                  </Link>

                  <div className="calendar-featured__content">
                    <p className="calendar-row__eyebrow">
                      {getStatusLabel(
                        upcomingTournament.estado,
                      )}
                    </p>

                    <h3>
                      {upcomingTournament.nombre}
                    </h3>

                    {club?.nombre ? (
                      <p className="calendar-featured__club">
                        <MapPin
                          size={15}
                          aria-hidden="true"
                        />

                        {club.nombre}
                      </p>
                    ) : (
                      <p className="calendar-featured__club">
                        <MapPin
                          size={15}
                          aria-hidden="true"
                        />

                        Club por confirmar
                      </p>
                    )}

                    {capacity > 0 ? (
                      <p className="calendar-featured__capacity">
                        <Users
                          size={15}
                          aria-hidden="true"
                        />

                        Hasta {capacity} plazas
                      </p>
                    ) : null}

                    {tournamentCategories.length ? (
                      <div className="calendar-row__categories">
                        {tournamentCategories.map(
                          (categoria) => (
                            <span key={categoria}>
                              {categoria}
                            </span>
                          ),
                        )}
                      </div>
                    ) : (
                      <div className="calendar-row__categories">
                        <span>
                          Categorías por confirmar
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="calendar-featured__aside">
                    <StatusBadge
                      texto={getStatusLabel(
                        upcomingTournament.estado,
                      )}
                      tipo={getStatusBadgeType(
                        upcomingTournament.estado,
                      )}
                    />

                    <Link
                      href={`/torneo/${upcomingTournament.slug}`}
                      className="btn-secondary"
                    >
                      Ver torneo
                      <ChevronRight
                        size={15}
                        aria-hidden="true"
                      />
                    </Link>

                    {upcomingTournament.estado ===
                      "inscripciones_abiertas" && (
                        <>
                          {user ? (
                            <Link
                              href={`/torneo/${upcomingTournament.slug}/inscribirse`}
                              className="btn-primary"
                            >
                              Inscribirme
                            </Link>
                          ) : (
                            <Link
                              href="/registro"
                              className="btn-primary"
                            >
                              Crear cuenta para inscribirme
                            </Link>
                          )}
                        </>
                      )}

                    <Link
                      href={`/torneo/${upcomingTournament.slug}`}
                      className="btn-tertiary"
                    >
                      Más información
                    </Link>
                  </div>
                </article>
              );
            })()}
          </section>
        ) : null}

        {/* ====================================================
            TODAS LAS PRUEBAS
            ==================================================== */}

        <section className="calendar-section">
          <div className="calendar-section-heading">
            <div>
              <p className="calendar-section-kicker">
                Temporada
              </p>

              <h2>Todas las pruebas</h2>
            </div>

            <span>
              {torneosFiltrados.length}{" "}
              {torneosFiltrados.length === 1
                ? "prueba"
                : "pruebas"}
            </span>
          </div>

          {!torneosFiltrados.length ? (
            <div className="calendar-empty">
              <CalendarDays
                size={28}
                aria-hidden="true"
              />

              <h2>
                No hay pruebas para estos filtros
              </h2>

              <p>
                Prueba a cambiar el estado o la categoría
                seleccionada.
              </p>

              <Link
                href="/calendario"
                className="btn-secondary"
              >
                Ver calendario completo
              </Link>
            </div>
          ) : (
            <ol className="calendar-list">
              {torneosFiltrados.map((torneo) => {
                const date = getDateParts(
                  torneo.fecha_inicio,
                );

                const club = torneo.clubs;

                const tournamentCategories =
                  getTournamentCategories(torneo);

                const capacity =
                  getTournamentCapacity(torneo);

                return (
                  <li
                    key={torneo.id}
                    className="calendar-row"
                  >
                    <Link
                      href={`/torneo/${torneo.slug}`}
                      className="calendar-row__date"
                      aria-label={`Ver ${torneo.nombre}`}
                    >
                      <span>{date.day}</span>

                      <strong>{date.month}</strong>

                      <small>{date.year}</small>
                    </Link>

                    <div className="calendar-row__main">
                      <div className="calendar-row__heading">
                        <div>
                          <p className="calendar-row__eyebrow">
                            {getStatusLabel(
                              torneo.estado,
                            )}
                          </p>

                          <h3>{torneo.nombre}</h3>
                        </div>

                        <StatusBadge
                          texto={getStatusLabel(
                            torneo.estado,
                          )}
                          tipo={getStatusBadgeType(
                            torneo.estado,
                          )}
                        />
                      </div>

                      <div className="calendar-row__meta">
                        <span>
                          <CalendarDays
                            size={13}
                            aria-hidden="true"
                          />

                          {formatearFecha(
                            torneo.fecha_inicio,
                          )}

                          {torneo.fecha_fin &&
                            torneo.fecha_fin !==
                            torneo.fecha_inicio
                            ? ` — ${formatearFecha(
                              torneo.fecha_fin,
                            )}`
                            : ""}
                        </span>

                        <span>
                          <MapPin
                            size={13}
                            aria-hidden="true"
                          />

                          {club?.nombre ??
                            "Club por confirmar"}
                        </span>

                        {capacity > 0 ? (
                          <span>
                            <Users
                              size={13}
                              aria-hidden="true"
                            />

                            Hasta {capacity} plazas
                          </span>
                        ) : null}
                      </div>

                      <div className="calendar-row__categories">
                        {tournamentCategories.length ? (
                          tournamentCategories.map(
                            (categoria) => (
                              <span key={categoria}>
                                {categoria}
                              </span>
                            ),
                          )
                        ) : (
                          <span>
                            Categorías por confirmar
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="calendar-row__action">
                      <Link
                        href={`/torneo/${torneo.slug}`}
                        className="btn-secondary"
                      >
                        Ver torneo
                        <ChevronRight
                          size={15}
                          aria-hidden="true"
                        />
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {/* ====================================================
            MASTER FINAL
            ==================================================== */}

        <section
          className="calendar-master"
          aria-label="Master Final"
        >
          <div className="calendar-master__identity">
            <Sparkles
              size={25}
              aria-hidden="true"
            />

            <div>
              <p>Evento especial</p>

              <h2>Master Final</h2>
            </div>
          </div>

          <div className="calendar-master__meta">
            <span>
              <strong>Clasificación:</strong>{" "}
              Race to Master
            </span>

            <span>
              <strong>Formato:</strong>{" "}
              Evento final de temporada
            </span>
          </div>

          <Link
            href="/master-final"
            className="btn-secondary"
          >
            Conocer el Master
            <ChevronRight
              size={15}
              aria-hidden="true"
            />
          </Link>
        </section>
      </div>
    </main>
  );
}