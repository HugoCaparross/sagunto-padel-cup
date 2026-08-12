import type { Metadata, Viewport } from "next";

import "./globals.css";

/* ============================================================
   SITE CONFIG
   ============================================================ */

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const siteName = "Sagunto Padel Cup";

const siteDescription =
  "Sagunto Padel Cup es el circuito de pádel amateur de Sagunto. Compite en las pruebas, suma puntos en el ranking y avanza hacia el Máster Final.";

/* ============================================================
   VIEWPORT
   ============================================================ */

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/* ============================================================
   GLOBAL METADATA
   ============================================================ */

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  applicationName: siteName,

  title: {
    default: "Sagunto Padel Cup | Circuito de Pádel de Sagunto",

    template: "%s | Sagunto Padel Cup",
  },

  description: siteDescription,

  keywords: [
    "Sagunto Padel Cup",
    "pádel Sagunto",
    "torneos de pádel Sagunto",
    "circuito de pádel Sagunto",
    "pádel Valencia",
    "torneos de pádel Valencia",
    "ranking pádel Sagunto",
    "Máster Final pádel",
  ],

  authors: [
    {
      name: "Sagunto Padel Cup",
    },
  ],

  creator: "Sagunto Padel Cup",

  publisher: "Sagunto Padel Cup",

  category: "sports",

  classification: "Sports",

  referrer: "origin-when-cross-origin",

  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },

  alternates: {
    canonical: "/",
    languages: {
      "es-ES": "/",
    },
  },

  robots: {
    index: true,
    follow: true,

    googleBot: {
      index: true,
      follow: true,

      "max-image-preview": "large",

      "max-video-preview": -1,

      "max-snippet": -1,
    },
  },

  openGraph: {
    type: "website",

    locale: "es_ES",

    url: siteUrl,

    siteName: siteName,

    title: "Sagunto Padel Cup | Circuito de Pádel de Sagunto",

    description: siteDescription,

    /*
     * Cuando tengamos el OG image definitivo,
     * se añadirá aquí:
     *
     * images: [
     *   {
     *     url: "/images/og/sagunto-padel-cup.jpg",
     *     width: 1200,
     *     height: 630,
     *     alt: "Sagunto Padel Cup",
     *   },
     * ],
     */
  },

  twitter: {
    card: "summary_large_image",

    title: "Sagunto Padel Cup | Circuito de Pádel de Sagunto",

    description: siteDescription,

    /*
     * Añadir cuando tengamos el recurso definitivo:
     *
     * images: [
     *   "/images/og/sagunto-padel-cup.jpg",
     * ],
     */
  },

  icons: {
    /*
     * No inventamos favicon.
     *
     * Cuando el logo oficial tenga sus assets
     * correspondientes, se pueden añadir:
     *
     * icon: "/favicon.ico",
     * apple: "/apple-touch-icon.png",
     */
  },
};

/* ============================================================
   ROOT LAYOUT
   ============================================================ */

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
