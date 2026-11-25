import Boton from "@/components/ui/Boton";
import type { Metadata } from "next";
import Link from "next/link";
import { cargarListadoJugadores } from "@/lib/jugadores/admin-datos";
import { fechaCorta } from "@/lib/formato";

export const metadata: Metadata = { title: "Jugadores · Admin" };

type Props = {
  searchParams: Promise<{ q?: string; estado?: string }>;
};

export default async function PaginaJugadores({ searchParams }: Props) {
  const sp = await searchParams;
  const jugadores = await cargarListadoJugadores();

  const termino = (sp.q ?? "").trim().toLowerCase();
  const estado = sp.estado ?? "todos";

  const filtrados = jugadores.filter((j) => {
    if (estado === "activos" && j.inscripcionesActivas === 0) return false;
    if (estado === "sin_completar" && j.onboardingCompleto) return false;
    if (!termino) return true;
    return (
      j.nombre.toLowerCase().includes(termino) ||
      (j.email ?? "").toLowerCase().includes(termino)
    );
  });

  const activos = jugadores.filter((j) => j.inscripcionesActivas > 0).length;
  const sinCompletar = jugadores.filter((j) => !j.onboardingCompleto).length;

  return (
    <main className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Jugadores</h1>
        <p className="text-sm text-[var(--color-muted)]">
          {jugadores.length} registrados · {activos} con inscripción activa · {sinCompletar} sin
          completar el perfil
        </p>
      </header>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 text-sm ring-1 ring-[var(--color-border)]">
        <label className="flex min-w-[220px] flex-1 flex-col gap-1">
          <span className="text-[var(--color-muted)]">Buscar por nombre o email</span>
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            className="rounded-md border border-[var(--color-border)] px-2 py-1.5"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[var(--color-muted)]">Mostrar</span>
          <select name="estado" defaultValue={estado} className="rounded-md border border-[var(--color-border)] px-2 py-1.5">
            <option value="todos">Todos</option>
            <option value="activos">Con inscripción activa</option>
            <option value="sin_completar">Perfil sin completar</option>
          </select>
        </label>

        <Boton variante="secundario" tamano="md" type="submit" className="">
          Filtrar
        </Boton>
      </form>

      {filtrados.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">No hay jugadores con esos filtros.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-surface)] text-left text-xs uppercase text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-2">Jugador</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2 text-right">Activas</th>
                <th className="px-4 py-2 text-right">Pruebas</th>
                <th className="px-4 py-2 text-right">Puntos</th>
                <th className="px-4 py-2">Última inscripción</th>
                <th className="px-4 py-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((j) => (
                <tr key={j.id} className="border-t border-[var(--color-border)]">
                  <td className="px-4 py-2">
                    <Link href={`/admin/jugadores/${j.id}`} className="font-medium hover:underline">
                      {j.nombre}
                    </Link>
                    {j.rol === "organizador" && (
                      <span className="ml-2 rounded bg-[var(--color-navy)] px-1.5 py-0.5 text-xs text-white">
                        Organizador
                      </span>
                    )}
                    {!j.visible && (
                      <span className="ml-2 text-xs text-[var(--color-muted)]">privado</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-[var(--color-muted)]">{j.email ?? "—"}</td>
                  <td className="px-4 py-2 text-right">{j.inscripcionesActivas}</td>
                  <td className="px-4 py-2 text-right">{j.pruebasJugadas}</td>
                  <td className="px-4 py-2 text-right">{j.puntos}</td>
                  <td className="px-4 py-2">
                    {j.ultimaActividad ? fechaCorta(j.ultimaActividad) : "—"}
                  </td>
                  <td className="px-4 py-2">
                    {j.onboardingCompleto ? (
                      <span className="text-[var(--color-success)]">Completo</span>
                    ) : (
                      <span className="text-[var(--color-warning)]">Sin completar</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}