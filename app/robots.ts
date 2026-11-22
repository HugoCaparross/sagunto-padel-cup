import type { MetadataRoute } from "next";
import { url, urlBase } from "@/lib/seo/url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/cuenta",
          "/cuenta/",
          "/onboarding",
          "/login",
          "/registro",
          "/recuperar",
          "/nueva-contrasena",
          "/verificar",
          "/auth/",
          "/inscribirse/",
          "/buscar-pareja",
          "/api/",
        ],
      },
    ],
    sitemap: url("/sitemap.xml"),
    host: urlBase(),
  };
}