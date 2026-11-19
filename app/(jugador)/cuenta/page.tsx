import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { usuarioActual } from "@/lib/auth/organizador";
import { cargarInscripcionesJugador, cargarProximaPrueba } from "@/lib/cuenta/cargar";
import {
  ETIQUETAS_CATEGORIA,
  ETIQUETAS_ESTADO_INSCRIPCION,
  ETIQUETAS_ESTADO_PRUEBA,
} from "@/lib/constantes";
import { fechaLarga } from "@/lib/formato";
import { obtenerRanking } from "@/lib/ranking/cargar";
import { progresoHistorico } from "@/lib/xp/cargar";
import { crearClienteServidor } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Mi panel" };

export default async function PaginaCuenta() {
  const userId = await usuarioActual();
  if (!userId) redirect("/login");

  const supabase = await crearClienteServidor();
  const { data: perfil } = await supabase
    .from("perfiles")
    .select("nombre")
    .eq("id", userId)
    .maybeSingle<{ nombre: string }>();

  const [inscripciones, proxima, progreso] = await Promise.all([
    cargarInscripcionesJugador(userId),
    cargarProximaPrueba(),
    progresoHistorico(userId),
  ]);

  const categoriaActual = inscripciones.find((i) => i.estado !== "retirada")?.categoria;
  const ranking = categoriaActual ? await obtenerRanking(categoriaActual) : [];
  const posicion = ranking.find((f) => f.clave === userId)?.posicion ?? null;

  const inscripcionProxima = proxima
    ? inscripciones.find((i) => i.prueba.id === proxima.id && i.estado !== "retirada")
    : undefined;

  return (
    <main className="container space-y-8 py-10">
      <header>
        <h1 className="text-2xl font-semibold">Hola, {perfil?.nombre || "jugador"}</h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3 rounded-xl bg-white p-5 ring-1 ring-[#D5D9DC]">
          <h2 className="font-semibold">Próxima prueba</h2>

          {proxima ? (
            <>
              <p className="text-lg font-medium">{proxima.nombre}</p>
              <p className="text-sm text-[#68737D]">
                {fechaLarga(proxima.fechaInicio)} · {proxima.sede}
              </p>
              <p className="text-sm">{ETIQUETAS_ESTADO_PRUEBA[proxima.estado]}</p>

              {inscripcionProxima ? (
                <p className="rounded-lg bg-[#EAF6EF] p-3 text-sm text-[#16845B]">
                  Inscrito en {ETIQUETAS_CATEGORIA[inscripcionProxima.categoria]} ·{" "}
                  {ETIQUETAS_ESTADO_INSCRIPCION[inscripcionProxima.estado]}
                </p>
              ) : proxima.estado === "abierta" ? (
                <Link
                  href={`/inscribirse/${proxima.slug}`}
                  className="inline-block rounded-lg bg-[#F0443A] px-4 py-2 text-sm font-medium text-white"
                >
                  Inscribirme
                </Link>
              ) : (
                <p className="text-sm text-[#68737D]">Las inscripciones aún no están abiertas.</p>
              )}
            </>
          ) : (
            <p className="text-sm text-[#68737D]">No hay pruebas próximas.</p>
          )}
        </section>

        <section className="space-y-4 rounded-xl bg-white p-5 ring-1 ring-[#D5D9DC]">
          <h2 className="font-semibold">Mi progreso</h2>

          <div className="flex items-baseline justify-between">
            <p className="text-3xl font-semibold">Nivel {progreso.nivel}</p>
            <p className="text-sm text-[#68737D]">{progreso.tier}</p>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-[#F4F5F4]">
            <div
              className="h-full rounded-full bg-[#A7C4A0]"
              style={{ width: `${Math.round(progreso.progreso * 100)}%` }}
            />
          </div>

          <p className="text-sm text-[#68737D]">
            {progreso.esMaximo
              ? "Nivel máximo alcanzado"
              : `Te faltan ${progreso.xpFaltante} XP para el nivel ${progreso.nivel + 1}`}
          </p>

          <p className="text-sm">
            {categoriaActual && posicion !== null
              ? `Posición ${posicion}.º en ${ETIQUETAS_CATEGORIA[categoriaActual]}`
              : "Sin posición en el ranking todavía"}
          </p>

          <Link href="/cuenta/progreso" className="text-sm underline">
            Ver mi progreso completo
          </Link>
        </section>
      </div>

      <section className="space-y-3 rounded-xl bg-white p-5 ring-1 ring-[#D5D9DC]">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Mis inscripciones</h2>
          <Link href="/cuenta/inscripciones" className="text-sm underline">
            Ver todas
          </Link>
        </div>

        {inscripciones.length === 0 ? (
          <p className="text-sm text-[#68737D]">Todavía no estás inscrito en ninguna prueba.</p>
        ) : (
          <ul className="divide-y divide-[#D5D9DC] text-sm">
            {inscripciones.slice(0, 3).map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>
                  {i.prueba.nombre} · {ETIQUETAS_CATEGORIA[i.categoria]} · {i.texto}
                </span>
                <span className="text-[#68737D]">{ETIQUETAS_ESTADO_INSCRIPCION[i.estado]}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}