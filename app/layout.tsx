/* eslint-disable @next/next/no-page-custom-font -- Material Symbols is shared from the root App Router layout. */
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

export const dynamic = "force-dynamic";

const poppins = localFont({
  src: [
    { path: "./fonts/poppins/Poppins-Regular.ttf", weight: "400" },
    { path: "./fonts/poppins/Poppins-Medium.ttf", weight: "500" },
    { path: "./fonts/poppins/Poppins-SemiBold.ttf", weight: "600" },
    { path: "./fonts/poppins/Poppins-Bold.ttf", weight: "700" },
  ],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Sagunto Padel Cup | Circuito de Pádel",
    template: "%s | Sagunto Padel Cup",
  },
  description:
    "Sagunto Padel Cup. Circuito amateur de pádel con ranking, pruebas y Master Final.",
  applicationName: "Sagunto Padel Cup",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "Sagunto Padel Cup",
    title: "Sagunto Padel Cup",
    description: "Mucho más que un torneo. Un circuito de pádel.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={poppins.variable}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,200..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
