import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerTokenCheckin } from "@/actions/checkin";
import BotonRetirar from "@/components/cuenta/BotonRetirar";
import QrCheckin from "@/components/checkin/QrCheckin";
import { cargarInscripcionesJugador } from "@/lib/cuenta/cargar";
import {
  ETIQUETAS_CATEGORIA,
  ETIQUETAS_ESTADO_INSCRIPCION,
  ETIQUETAS_ESTADO_PRUEBA,
} from "@/lib/constantes";
import { fechaLarga } from "@/lib/formato";
import { usuarioActual } from "@/lib/auth/organizador";

export const metadata: Metadata = { title: "Mis inscripciones" };

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function PaginaInscripciones() {
  const userId = await usuarioActual();
  if (!userId) redirect("/login");

  const inscripciones = await cargarInscripcionesJugador(userId);

  // Código QR solo para las inscripciones activas de pruebas que no han terminado
  const conQr = await Promise.all(
    inscripciones.map(async (i) => {
      if (!i.activa || i.prueba.estado === "finalizada") return { i, qr: null };
      const r = await obtenerTokenCheckin({ inscripcionId: i.id });
      if (!r.ok) return { i, qr: null };
      return {
        i,
        qr: {
          url: `${SITE}/admin/checkin/${r.datos.token}`,
          llegadaAt: r.datos.checkinAt,
        },
      };
    })
  );

  return (
    <main className="container space-y-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Mis inscripciones</h1>
        <Link href="/calendario" className="text-sm underline">
          Ver calendario de pruebas
        </Link>
      </header>

      {conQr.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">Todavía no estás inscrito en ninguna prueba.</p>
      ) : (
        <ul className="space-y-4">
          {conQr.map(({ i, qr }) => (
            <li key={i.id} className="grid gap-4 rounded-xl bg-white p-5 ring-1 ring-[var(--color-border)] md:grid-cols-[1fr_auto]">
              <div className="space-y-2">
                <p className="text-lg font-medium">{i.prueba.nombre}</p>
                <p className="text-sm text-[var(--color-muted)]">
                  {fechaLarga(i.prueba.fechaInicio)} · {i.prueba.sede}
                </p>
                <p className="text-sm">
                  {ETIQUETAS_CATEGORIA[i.categoria]} · {i.texto}
                </p>
                <p className="text-sm">
                  Estado: {ETIQUETAS_ESTADO_INSCRIPCION[i.estado]} ·{" "}
                  {ETIQUETAS_ESTADO_PRUEBA[i.prueba.estado]}
                </p>

                {i.puedeRetirarse && <BotonRetirar inscripcionId={i.id} />}
              </div>

              {qr && (
                <div className="md:w-[260px]">
                  <QrCheckin url={qr.url} llegadaAt={qr.llegadaAt} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}