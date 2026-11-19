import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { historialConsentimientos } from "@/actions/legal";
import FormularioPerfil from "@/components/cuenta/FormularioPerfil";
import { usuarioActual } from "@/lib/auth/organizador";
import { fechaCorta } from "@/lib/formato";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { TALLAS } from "@/lib/validadores/auth";

export const metadata: Metadata = { title: "Mi perfil" };

type DatosDeportivosGuardados = {
  ladoPista?: "derecha" | "izquierda" | "ambos" | null;
  manoHabil?: "diestra" | "zurda" | null;
  pala?: string | null;
  otros?: Record<string, string>;
};

const ETIQUETA_CONSENTIMIENTO: Record<string, string> = {
  privacidad: "Política de privacidad",
  imagen: "Uso de imagen",
  mayoria_o_tutor: "Mayoría de edad o autorización de tutor",
  cookies_analitica: "Cookies de analítica",
  comunicaciones: "Comunicaciones",
};

export default async function PaginaPerfil() {
  const userId = await usuarioActual();
  if (!userId) redirect("/login");

  const supabase = await crearClienteServidor();
  const { data: perfil } = await supabase
    .from("perfiles")
    .select("nombre, talla_camiseta, visibilidad_publica, consentimiento_imagen, datos_deportivos")
    .eq("id", userId)
    .single<{
      nombre: string;
      talla_camiseta: (typeof TALLAS)[number] | null;
      visibilidad_publica: boolean;
      consentimiento_imagen: boolean;
      datos_deportivos: DatosDeportivosGuardados | null;
    }>();

  if (!perfil) redirect("/cuenta");

  const dd = perfil.datos_deportivos ?? {};
  const otros = Object.entries(dd.otros ?? {})
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

  const historial = await historialConsentimientos();
  const filas = historial.ok ? historial.filas.slice(0, 10) : [];

  return (
    <main className="container grid gap-10 py-10 lg:grid-cols-[1fr_320px]">
      <section className="max-w-2xl">
        <h1 className="mb-6 text-2xl font-semibold">Mi perfil</h1>
        <FormularioPerfil
          inicial={{
            nombre: perfil.nombre,
            talla: perfil.talla_camiseta,
            visibilidadPublica: perfil.visibilidad_publica,
            consentimientoImagen: perfil.consentimiento_imagen,
            ladoPista: dd.ladoPista ?? null,
            manoHabil: dd.manoHabil ?? null,
            pala: dd.pala ?? "",
            otros,
          }}
        />
      </section>

      <aside className="space-y-6">
        <section className="space-y-3 rounded-xl bg-white p-5 ring-1 ring-[#D5D9DC]">
          <h2 className="font-semibold">Historial de consentimientos</h2>
          {filas.length === 0 ? (
            <p className="text-sm text-[#68737D]">Todavía no hay registros.</p>
          ) : (
            <ul className="divide-y divide-[#D5D9DC] text-sm">
              {filas.map((f) => (
                <li key={f.id} className="py-2">
                  <p>
                    {ETIQUETA_CONSENTIMIENTO[f.tipo] ?? f.tipo}:{" "}
                    <span className={f.concedido ? "text-[#16845B]" : "text-[#C73535]"}>
                      {f.concedido ? "aceptado" : "retirado"}
                    </span>
                  </p>
                  <p className="text-xs text-[#68737D]">{fechaCorta(f.registradoAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-2 rounded-xl bg-white p-5 ring-1 ring-[#D5D9DC] text-sm">
          <h2 className="font-semibold">Contraseña</h2>
          <p className="text-[#68737D]">Si quieres cambiarla, pide un enlace de recuperación.</p>
          <Link href="/recuperar" className="underline">
            Cambiar contraseña
          </Link>
        </section>
      </aside>
    </main>
  );
}