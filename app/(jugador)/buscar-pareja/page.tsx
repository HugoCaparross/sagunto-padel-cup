import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { listarBuscaPareja } from "@/actions/inscripciones";
import BotonUnirse from "@/components/inscripciones/BotonUnirse";
import { usuarioActual } from "@/lib/auth/organizador";
import { ETIQUETAS_CATEGORIA, type Categoria } from "@/lib/constantes";
import { crearClienteServidor } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Buscar pareja" };

type Props = { searchParams: Promise<{ prueba?: string }> };

export default async function PaginaBuscarPareja({ searchParams }: Props) {
  const userId = await usuarioActual();
  if (!userId) redirect("/login?siguiente=/buscar-pareja");

  const { prueba: slugElegido } = await searchParams;

  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("pruebas")
    .select("id, slug, nombre")
    .eq("estado", "abierta")
    .order("fecha_inicio", { ascending: true });

  const abiertas = (data ?? []) as { id: string; slug: string; nombre: string }[];

  if (abiertas.length === 0) {
    return (
      <main className="container py-10">
        <h1 className="text-2xl font-semibold">Buscar pareja</h1>
        <p className="mt-4 text-sm text-muted">
          No hay pruebas con inscripciones abiertas ahora mismo.
        </p>
      </main>
    );
  }

  const elegida = abiertas.find((p) => p.slug === slugElegido) ?? abiertas[0];
  const res = await listarBuscaPareja(elegida.id);

  return (
    <main className="container space-y-6 py-10">
      <header className="space-y-4">
        <h1 className="text-2xl font-semibold">Buscar pareja</h1>
        <nav className="flex flex-wrap gap-2">
          {abiertas.map((p) => (
            <Link
              key={p.id}
              href={`/buscar-pareja?prueba=${p.slug}`}
              aria-current={p.id === elegida.id ? "page" : undefined}
              className={`rounded-md px-3 py-1.5 text-sm ${p.id === elegida.id ? "bg-navy text-white" : "card"
                }`}
            >
              {p.nombre}
            </Link>
          ))}
        </nav>
      </header>

      {!res.ok ? (
        <p className="alerta alerta-error">{res.error}</p>
      ) : res.filas.length === 0 ? (
        <p className="text-sm text-muted">
          Nadie busca pareja en esta prueba ahora mismo. Si te inscribes, aparecerás aquí.
        </p>
      ) : (
        <ul className="card divide-y divide-border overflow-hidden">
          {res.filas.map((f) => (
            <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="font-medium">{f.nombre}</p>
                <p className="text-sm text-muted">
                  {ETIQUETAS_CATEGORIA[f.categoria as Categoria]}
                </p>
              </div>
              <BotonUnirse inscripcionId={f.id} />
            </li>
          ))}
        </ul>
      )}

      <Link href={`/inscribirse/${elegida.slug}`} className="inline-block text-sm underline">
        Inscribirme en {elegida.nombre}
      </Link>
    </main>
  );
}