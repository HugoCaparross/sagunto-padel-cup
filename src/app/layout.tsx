import type { Metadata } from "next";
import { Oswald, Poppins } from "next/font/google";
import "./globals.css";

const oswald = Oswald({
    subsets: ["latin"],
    variable: "--font-oswald",
    display: "swap",
});

const poppins = Poppins({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-poppins",
    display: "swap",
});

export const metadata: Metadata = {
    title: "Sagunto Padel Cup | Circuito 2026/27",
    description:
        "Compite en Sagunto, suma puntos y vive el pádel. Sigue el calendario, el ranking individual y los resultados del circuito.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es">
            <body className={`${oswald.variable} ${poppins.variable}`}>
                {children}
            </body>
        </html>
    );
}