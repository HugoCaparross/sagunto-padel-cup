import type { Metadata } from "next";
import Link from "next/link";
import { estadoLegal } from "@/actions/legal";
import {
  ESTADOS_QUE_OCUPAN_PLAZA,
  ETIQUETAS_ESTADO_PRUEBA,
  type EstadoPrueba,
} from "@/lib/constantes";
import { fechaLarga } from "@/lib/formato";
import { crearClienteAdmin } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Resumen · Admin" };

type PruebaResumen = {
  id: string;
  nombre: string;
  estado: EstadoPrueba;
  fecha_inicio: string;
  plazas_maximas: number;
};

function Kpi({
  etiqueta,
  valor,
  aviso,
}: {
  etiqueta: string;
  valor: string | number;
  aviso?: boolean;
}) {
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-[#D5D9DC]">
      <p className="text-xs text-[#68737D]">{etiqueta}</p>
      <p className={`mt-1 text-2xl font-semibold ${aviso ? "text-[#B77912]" : ""}`}>{valor}</p>
    </div>
  );
}

export default async function PaginaResumen() {
  const admin = crearClienteAdmin();

  const [{ data: proxima }, { count: totalPruebas }, { count: contactosSinLeer }, legal] =
    await Promise.all([
      admin
        .from("pruebas")
        .select("id, nombre, estado, fecha_inicio, plazas_maximas")
        .neq("estado", "finalizada")
        .order("fecha_inicio", { ascending: true })
        .limit(1)
        .maybeSingle<PruebaResumen>(),
      admin.from("pruebas").select("id", { count: "exact", head: true }),
      admin
        .from("contactos")
        .select("id", { count: "exact", head: true })
        .eq("estado", "nueva"),
      estadoLegal(),
    ]);

  let inscritas = 0;
  if (proxima) {
    const { count } = await admin
      .from("inscripciones")
      .select("id", { count: "exact", head: true })
      .eq("prueba_id", proxima.id)
      .in("estado", [...ESTADOS_QUE_OCUPAN_PLAZA]);
    inscritas = count ?? 0;
  }

  const documentosPendientes = legal.ok ? legal.faltan.length : null;

  return (
    <main className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Resumen</h1>
        <p className="text-sm text-[#68737D]">Lo que necesitas hoy</p>
      </header>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Kpi etiqueta="Pruebas en el circuito" valor={totalPruebas ?? 0} />
        <Kpi
          etiqueta="Parejas activas en la próxima prueba"
          valor={proxima ? `${inscritas} / ${proxima.plazas_maximas}` : "—"}
        />
        <Kpi etiqueta="Contactos sin leer" valor={contactosSinLeer ?? 0} aviso={(contactosSinLeer ?? 0) > 0} />
        <Kpi
          etiqueta="Documentos legales pendientes"
          valor={documentosPendientes ?? "—"}
          aviso={(documentosPendientes ?? 0) > 0}
        />
      </section>

      <section className="space-y-3 rounded-xl bg-white p-5 ring-1 ring-[#D5D9DC]">
        <h2 className="font-semibold">Próxima prueba</h2>

        {proxima ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-lg font-medium">{proxima.nombre}</p>
              <p className="text-sm text-[#68737D]">
                {fechaLarga(proxima.fecha_inicio)} · {ETIQUETAS_ESTADO_PRUEBA[proxima.estado]}
              </p>
            </div>
            <Link
              href={`/admin/pruebas/${proxima.id}`}
              className="rounded-lg bg-[#F0443A] px-4 py-2 text-sm font-medium text-white"
            >
              Abrir prueba
            </Link>
          </div>
        ) : (
          <p className="text-sm text-[#68737D]">No hay pruebas pendientes.</p>
        )}
      </section>

      <section className="space-y-3 rounded-xl bg-white p-5 ring-1 ring-[#D5D9DC]">
        <h2 className="font-semibold">Accesos rápidos</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href="/admin/pruebas/nueva" className="rounded-lg bg-[#F4F5F4] px-3 py-2 hover:bg-[#EDEEED]">
            Crear prueba
          </Link>
          <Link href="/admin/contactos?estado=nueva" className="rounded-lg bg-[#F4F5F4] px-3 py-2 hover:bg-[#EDEEED]">
            Ver contactos nuevos
          </Link>
          <Link href="/admin/legal" className="rounded-lg bg-[#F4F5F4] px-3 py-2 hover:bg-[#EDEEED]">
            Documentos legales
          </Link>
        </div>
      </section>
    </main>
  );
}