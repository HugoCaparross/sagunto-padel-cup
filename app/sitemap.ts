import type { MetadataRoute } from "next";
import { url } from "@/lib/seo/url";
import { crearClienteAdmin } from "@/lib/supabase/server";

// Rutas fijas de la web pública. Las rutas privadas no van aquí.
const RUTAS_FIJAS: { ruta: string; prioridad: number; frecuencia: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { ruta: "/", prioridad: 1, frecuencia: "daily" },
  { ruta: "/calendario", prioridad: 0.9, frecuencia: "weekly" },
  { ruta: "/ranking", prioridad: 0.9, frecuencia: "daily" },
  { ruta: "/jugadores", prioridad: 0.7, frecuencia: "weekly" },
  { ruta: "/noticias", prioridad: 0.8, frecuencia: "weekly" },
  { ruta: "/premios", prioridad: 0.6, frecuencia: "monthly" },
  { ruta: "/patrocinadores", prioridad: 0.6, frecuencia: "monthly" },
  { ruta: "/circuito", prioridad: 0.6, frecuencia: "monthly" },
  { ruta: "/puntos", prioridad: 0.6, frecuencia: "monthly" },
  { ruta: "/faq", prioridad: 0.5, frecuencia: "monthly" },
  { ruta: "/contacto", prioridad: 0.4, frecuencia: "yearly" },
  { ruta: "/reglamento", prioridad: 0.4, frecuencia: "monthly" },
  { ruta: "/condiciones", prioridad: 0.3, frecuencia: "yearly" },
  { ruta: "/privacidad", prioridad: 0.3, frecuencia: "yearly" },
  { ruta: "/cookies", prioridad: 0.3, frecuencia: "yearly" },
  { ruta: "/aviso-legal", prioridad: 0.3, frecuencia: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const admin = crearClienteAdmin();

  const [{ data: noticias }, { data: pruebas }, { data: jugadores }] = await Promise.all([
    admin
      .from("noticias")
      .select("slug, updated_at")
      .eq("publicada", true),
    admin
      .from("pruebas")
      .select("slug, fecha_fin")
      .neq("estado", "proxima"),
    admin
      .from("perfiles")
      .select("slug, created_at")
      .eq("visibilidad_publica", true),
  ]);

  const fijas: MetadataRoute.Sitemap = RUTAS_FIJAS.map((r) => ({
    url: url(r.ruta),
    changeFrequency: r.frecuencia,
    priority: r.prioridad,
  }));

  const entradasNoticias: MetadataRoute.Sitemap = (noticias ?? []).map((n) => ({
    url: url(`/noticias/${n.slug}`),
    lastModified: new Date(n.updated_at),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const entradasPruebas: MetadataRoute.Sitemap = (pruebas ?? []).map((p) => ({
    url: url(`/pruebas/${p.slug}`),
    lastModified: new Date(p.fecha_fin),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  // Solo jugadores con perfil público; la ficha usa slug legible.
  const entradasJugadores: MetadataRoute.Sitemap = (jugadores ?? []).flatMap((j) =>
    j.slug
      ? [{
          url: url(`/jugadores/${j.slug}`),
          lastModified: new Date(j.created_at),
          changeFrequency: "weekly",
          priority: 0.5,
        }]
      : []
  );

  return [...fijas, ...entradasNoticias, ...entradasPruebas, ...entradasJugadores];
}
