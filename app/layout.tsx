import type { Metadata } from "next";
import { Bebas_Neue, Montserrat } from "next/font/google";
import "./globals.css";

const bebasNeue = Bebas_Neue({
    variable: "--font-bebas",
    subsets: ["latin"],
    weight: "400",
    display: "swap",
});

const montserrat = Montserrat({
    variable: "--font-montserrat",
    subsets: ["latin"],
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
    metadataBase: new URL("https://saguntopadelcup.es"),
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
        <html lang="es">
            <body
                className={`${bebasNeue.variable} ${montserrat.variable}`}
            >
                {children}
            </body>
        </html>
    );
}