import type { Metadata } from "next";
import BotonExportar from "@/components/ajustes/BotonExportar";
import GestionRoles from "@/components/ajustes/GestionRoles";
import Paginacion from "@/components/ajustes/Paginacion";
import { listarAuditoria, PAGINA_TAMANO } from "@/lib/ajustes/auditoria";
import { usuarioActual } from "@/lib/auth/organizador";
import { cargarListadoJugadores } from "@/lib/jugadores/admin-datos";
import { fechaCorta } from "@/lib/formato";

export const metadata: Metadata = { title: "Ajustes · Admin" };

type Props = {
  searchParams: Promise<{
    accion?: string;
    tabla?: string;
    usuario?: string;
    desde?: string;
    hasta?: string;
    pagina?: string;
  }>;
};

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

export default async function PaginaAjustes({ searchParams }: Props) {
  const sp = await searchParams;
  const usuarioId = (await usuarioActual()) ?? "";

  const pagina = Math.max(1, Number(sp.pagina) || 1);
  const filtros = {
    accion: sp.accion?.trim() || undefined,
    tabla: sp.tabla?.trim() || undefined,
    usuarioId: sp.usuario || undefined,
    desde: sp.desde && FECHA.test(sp.desde) ? sp.desde : undefined,
    hasta: sp.hasta && FECHA.test(sp.hasta) ? sp.hasta : undefined,
    pagina,
  };

  const [auditoria, jugadores] = await Promise.all([
    listarAuditoria(filtros),
    cargarListadoJugadores(),
  ]);

  const personas = jugadores.map((j) => ({ id: j.id, nombre: j.nombre, email: j.email }));
  const organizadores = personas.filter((p) => jugadores.find((j) => j.id === p.id)?.rol === "organizador");
  const candidatos = personas.filter((p) => jugadores.find((j) => j.id === p.id)?.rol !== "organizador");

  const query = (extra: Record<string, string | number>) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...extra })) {
      if (v !== undefined && v !== "") params.set(k, String(v));
    }
    return `?${params.toString()}`;
  };

  return (
    <main className="space-y-12">
      <header>
        <h1 className="text-2xl font-semibold">Ajustes</h1>
        <p className="text-sm text-muted">Roles, auditoría y exportación de datos.</p>
      </header>

      <section className="space-y-4">
        <h2 className="font-semibold">Organizadores</h2>
        <GestionRoles
          organizadores={organizadores}
          jugadores={candidatos}
          usuarioId={usuarioId}
        />
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold">Registro de auditoría</h2>

        <form method="get" className="card grid gap-3 p-4 text-sm md:grid-cols-5 md:items-end">
          <label className="flex flex-col gap-1">
            <span className="text-muted">Acción</span>
            <input name="accion" defaultValue={sp.accion ?? ""} className="rounded-md border border-border bg-white px-2 py-1.5" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-muted">Tabla</span>
            <input name="tabla" defaultValue={sp.tabla ?? ""} className="rounded-md border border-border bg-white px-2 py-1.5" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-muted">Organizador</span>
            <select name="usuario" defaultValue={sp.usuario ?? ""} className="rounded-md border border-border bg-white px-2 py-1.5">
              <option value="">Todos</option>
              {auditoria.organizadores.map((o) => (
                <option key={o.id} value={o.id}>{o.nombre}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-muted">Desde</span>
            <input type="date" name="desde" defaultValue={sp.desde ?? ""} className="rounded-md border border-border bg-white px-2 py-1.5" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-muted">Hasta</span>
            <input type="date" name="hasta" defaultValue={sp.hasta ?? ""} className="rounded-md border border-border bg-white px-2 py-1.5" />
          </label>
          <div className="md:col-span-5">
            <button type="submit" className="btn btn-primario">Filtrar</button>
          </div>
        </form>

        {auditoria.filas.length === 0 ? (
          <p className="text-sm text-muted">No hay registros con estos filtros.</p>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left text-sm uppercase text-muted">
                <tr>
                  <th className="px-4 py-2">Fecha</th>
                  <th className="px-4 py-2">Usuario</th>
                  <th className="px-4 py-2">Acción</th>
                  <th className="px-4 py-2">Tabla</th>
                  <th className="px-4 py-2">Registro</th>
                  <th className="px-4 py-2">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {auditoria.filas.map((f) => (
                  <tr key={f.id} className="border-t border-border align-top">
                    <td className="px-4 py-2 whitespace-nowrap">{fechaCorta(f.creadoAt)}</td>
                    <td className="px-4 py-2">{f.usuario}</td>
                    <td className="px-4 py-2 font-mono text-sm">{f.accion}</td>
                    <td className="px-4 py-2 text-muted">{f.tabla}</td>
                    <td className="px-4 py-2 font-mono text-sm text-muted break-all">{f.registroId ?? "—"}</td>
                    <td className="px-4 py-2">{f.motivo ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Paginacion
          pagina={pagina}
          total={auditoria.total}
          tamano={PAGINA_TAMANO}
          construirHref={(p) => query({ pagina: p })}
        />
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold">Exportar datos</h2>
        <p className="text-sm text-muted">
          Los archivos contienen datos personales. Cada descarga queda registrada en la auditoría.
        </p>
        <div className="flex flex-wrap gap-3">
          <BotonExportar recurso="jugadores" etiqueta="Jugadores" />
          <BotonExportar recurso="inscripciones" etiqueta="Inscripciones" />
          <BotonExportar recurso="puntos" etiqueta="Puntos" />
          <BotonExportar recurso="auditoria" etiqueta="Auditoría (últimos 5.000)" />
        </div>
      </section>
    </main>
  );
}