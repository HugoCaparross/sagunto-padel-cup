import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import FormularioInscripcion, {
  type DatosInscripcion,
} from "@/components/inscripciones/FormularioInscripcion";
import { usuarioActual } from "@/lib/auth/organizador";
import { CATEGORIAS, type Categoria, type EstadoInscripcion } from "@/lib/constantes";
import { crearClienteServidor } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Inscribirse" };

type Props = { params: Promise<{ prueba: string }> };

type PruebaRow = {
  id: string;
  slug: string;
  nombre: string;
  estado: string;
  fecha_inicio: string;
  fecha_fin: string;
  sede: string;
  precio_pareja_centimos: number;
  plazas_maximas: number;
  temporada_id: number;
};

export default async function PaginaInscribirse({ params }: Props) {
  const { prueba: slug } = await params;

  const userId = await usuarioActual();
  if (!userId) redirect(`/login?siguiente=/inscribirse/${slug}`);

  const supabase = await crearClienteServidor();

  const { data: prueba } = await supabase
    .from("pruebas")
    .select(
      "id, slug, nombre, estado, fecha_inicio, fecha_fin, sede, precio_pareja_centimos, plazas_maximas, temporada_id"
    )
    .eq("slug", slug)
    .maybeSingle<PruebaRow>();
  if (!prueba) notFound();

  const [{ data: cats }, { data: ocupacion }, { data: propia }, { data: asignada }] =
    await Promise.all([
      supabase.from("prueba_categorias").select("categoria").eq("prueba_id", prueba.id),
      supabase.from("v_ocupacion").select("ocupadas").eq("prueba_id", prueba.id),
      supabase
        .from("inscripciones")
        .select("categoria, estado")
        .eq("prueba_id", prueba.id)
        .neq("estado", "retirada")
        .or(`jugador_1.eq.${userId},jugador_2.eq.${userId}`)
        .maybeSingle(),
      supabase
        .from("categorias_temporada")
        .select("categoria")
        .eq("temporada_id", prueba.temporada_id)
        .eq("jugador_id", userId)
        .maybeSingle(),
    ]);

  const ocupadas = (ocupacion ?? []).reduce(
    (total: number, f: { ocupadas: number }) => total + f.ocupadas,
    0
  );

  const disponibles = new Set<string>(
    (cats ?? []).map((c: { categoria: string }) => c.categoria)
  );

  // Si el jugador tiene categoría asignada para la temporada, solo puede elegir esa
  const permitidas = asignada
    ? CATEGORIAS.filter((c) => c === asignada.categoria && disponibles.has(c))
    : CATEGORIAS.filter((c) => disponibles.has(c));

  const datos: DatosInscripcion = {
    prueba: {
      id: prueba.id,
      slug: prueba.slug,
      nombre: prueba.nombre,
      sede: prueba.sede,
      fechaInicio: prueba.fecha_inicio,
      fechaFin: prueba.fecha_fin,
      precioCentimos: prueba.precio_pareja_centimos,
      estado: prueba.estado,
    },
    categorias: permitidas as Categoria[],
    plazasLibres: Math.max(0, prueba.plazas_maximas - ocupadas),
    propia: propia
      ? {
        categoria: propia.categoria as Categoria,
        estado: propia.estado as EstadoInscripcion,
      }
      : null,
  };

  return (
    <main className="mx-auto max-w-xl space-y-6 px-4 py-10">
      <nav className="text-sm text-muted">
        <Link href="/calendario" className="hover:underline">
          Calendario
        </Link>
        <span> / Inscribirse</span>
      </nav>
      <FormularioInscripcion datos={datos} />
    </main>
  );
}