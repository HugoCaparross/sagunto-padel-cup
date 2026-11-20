import type { Metadata } from "next";
import { url } from "@/lib/seo/url";

const NOMBRE = "Sagunto Padel Cup";

type Entrada = {
    titulo: string;
    descripcion: string;
    ruta: string;
    imagen?: string | null;
    tipo?: "website" | "article";
};

// Metadatos completos para compartir en redes y mensajería.
export function metadatosPagina(e: Entrada): Metadata {
    const imagenes = e.imagen ? [{ url: e.imagen }] : undefined;

    return {
        title: e.titulo,
        description: e.descripcion,
        alternates: { canonical: url(e.ruta) },
        openGraph: {
            title: e.titulo,
            description: e.descripcion,
            url: url(e.ruta),
            siteName: NOMBRE,
            locale: "es_ES",
            type: e.tipo ?? "website",
            images: imagenes,
        },
        twitter: {
            card: e.imagen ? "summary_large_image" : "summary",
            title: e.titulo,
            description: e.descripcion,
            images: e.imagen ? [e.imagen] : undefined,
        },
    };
}