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
        <p className="text-sm text-[#68737D]">
          {jugadores.length} registrados · {activos} con inscripción activa · {sinCompletar} sin
          completar el perfil
        </p>
      </header>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 text-sm ring-1 ring-[#D5D9DC]">
        <label className="flex min-w-[220px] flex-1 flex-col gap-1">
          <span className="text-[#68737D]">Buscar por nombre o email</span>
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            className="rounded-md border border-[#D5D9DC] px-2 py-1.5"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[#68737D]">Mostrar</span>
          <select name="estado" defaultValue={estado} className="rounded-md border border-[#D5D9DC] px-2 py-1.5">
            <option value="todos">Todos</option>
            <option value="activos">Con inscripción activa</option>
            <option value="sin_completar">Perfil sin completar</option>
          </select>
        </label>

        <button type="submit" className="rounded-lg bg-[#0D1B2A] px-4 py-2 text-white">
          Filtrar
        </button>
      </form>

      {filtrados.length === 0 ? (
        <p className="text-sm text-[#68737D]">No hay jugadores con esos filtros.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-[#D5D9DC]">
          <table className="w-full text-sm">
            <thead className="bg-[#F4F5F4] text-left text-xs uppercase text-[#68737D]">
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
                <tr key={j.id} className="border-t border-[#D5D9DC]">
                  <td className="px-4 py-2">
                    <Link href={`/admin/jugadores/${j.id}`} className="font-medium hover:underline">
                      {j.nombre}
                    </Link>
                    {j.rol === "organizador" && (
                      <span className="ml-2 rounded bg-[#0D1B2A] px-1.5 py-0.5 text-xs text-white">
                        Organizador
                      </span>
                    )}
                    {!j.visible && (
                      <span className="ml-2 text-xs text-[#68737D]">privado</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-[#68737D]">{j.email ?? "—"}</td>
                  <td className="px-4 py-2 text-right">{j.inscripcionesActivas}</td>
                  <td className="px-4 py-2 text-right">{j.pruebasJugadas}</td>
                  <td className="px-4 py-2 text-right">{j.puntos}</td>
                  <td className="px-4 py-2">
                    {j.ultimaActividad ? fechaCorta(j.ultimaActividad) : "—"}
                  </td>
                  <td className="px-4 py-2">
                    {j.onboardingCompleto ? (
                      <span className="text-[#16845B]">Completo</span>
                    ) : (
                      <span className="text-[#B77912]">Sin completar</span>
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