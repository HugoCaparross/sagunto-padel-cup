import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.saguntopadelcup.com"),
  title: {
    default: "Sagunto Padel Cup",
    template: "%s | Sagunto Padel Cup",
  },
  description:
    "Sagunto Padel Cup es el circuito de pádel de referencia en Sagunto. Torneos, ranking, inscripciones, resultados, jugadores y Race to Master.",
  applicationName: "Sagunto Padel Cup",
  generator: "Next.js",
  keywords: [
    "Sagunto Padel Cup",
    "Sagunto Padel",
    "pádel Sagunto",
    "torneos de pádel",
    "torneos pádel Sagunto",
    "ranking pádel",
    "circuito pádel",
    "pádel Valencia",
  ],
  authors: [
    {
      name: "Sagunto Padel Cup",
    },
  ],
  creator: "Sagunto Padel Cup",
  publisher: "Sagunto Padel Cup",
  formatDetection: {
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "/",
    siteName: "Sagunto Padel Cup",
    title: "Sagunto Padel Cup",
    description:
      "El circuito de pádel de Sagunto. Compite, suma puntos, escala posiciones y llega al Master.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sagunto Padel Cup",
    description:
      "El circuito de pádel de Sagunto. Torneos, ranking, jugadores y Race to Master.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}