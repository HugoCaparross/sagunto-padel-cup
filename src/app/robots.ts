import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/public/seo";
export default function robots(): MetadataRoute.Robots {
    return { rules: [{ userAgent: "*", allow: ["/"], disallow: ["/admin", "/api", "/login", "/registro", "/area-privada"] }], sitemap: absoluteUrl("/sitemap.xml") };
}
