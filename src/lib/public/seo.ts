import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.saguntopadelcup.com";

export function absoluteUrl(path: string): string {
    return new URL(path, SITE_URL).toString();
}

export function buildMetadata(input: {
    title: string;
    description: string;
    path: string;
    image?: string | null;
    noIndex?: boolean;
}): Metadata {
    const url = absoluteUrl(input.path);
    const image = input.image ? absoluteUrl(input.image) : undefined;
    return {
        title: input.title,
        description: input.description,
        alternates: { canonical: input.path },
        robots: input.noIndex ? { index: false, follow: false } : { index: true, follow: true },
        openGraph: { type: "website", locale: "es_ES", siteName: "Sagunto Padel Cup", title: input.title, description: input.description, url, ...(image ? { images: [{ url: image }] } : {}) },
        twitter: { card: "summary_large_image", title: input.title, description: input.description, ...(image ? { images: [image] } : {}) },
    };
}
