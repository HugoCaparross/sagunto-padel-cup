// Ruta: src/app/layout.tsx

import type { Metadata } from "next";
import "./globals.css";
import CookieConsent from "@/components/CookieConsent";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),

  title: {
    default: "Sagunto Padel Cup",
    template: "%s · Sagunto Padel Cup",
  },

  description:
    "Circuito amateur de pádel en Sagunto. Inscripciones, ranking, cuadros y resultados en directo.",

  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "Sagunto Padel Cup",
  },

  twitter: {
    card: "summary_large_image",
  },

  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
