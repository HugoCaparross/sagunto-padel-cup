import type { Metadata } from "next";
import PanelPatrocinadores from "@/components/patrocinio/PanelPatrocinadores";
import PanelPremios from "@/components/patrocinio/PanelPremios";
import SelectorPrueba from "@/components/patrocinio/SelectorPrueba";
import { cargarPatrociniosAdmin } from "@/lib/patrocinio/admin";
import { elegirPrueba, listarPruebasSelector } from "@/lib/patrocinio/publico";

export const metadata: Metadata = { title: "Patrocinio y premios · Admin" };

type Props = {
    searchParams: Promise<{ prueba?: string }>;
};

export default async function PaginaPatrocinioAdmin({ searchParams }: Props) {
    const { prueba: slug } = await searchParams;

    const pruebas = await listarPruebasSelector();
    const elegida = elegirPrueba(pruebas, slug);

    if (!elegida) {
        return (
            <p className="text-sm text-[var(--color-muted)]">
                Crea una prueba antes de asignar patrocinadores o premios.
            </p>
        );
    }

    const datos = await cargarPatrociniosAdmin(elegida.id);

    return (
        <main className="space-y-10">
            <header className="space-y-4">
                <div>
                    <h1 className="text-2xl font-semibold">Patrocinio y premios</h1>
                    <p className="text-sm text-[var(--color-muted)]">Gestiona los patrocinadores y los premios de cada prueba.</p>
                </div>
                <SelectorPrueba pruebas={pruebas} activaId={elegida.id} ruta="/admin/patrocinio" />
            </header>

            <PanelPatrocinadores
                pruebaId={elegida.id}
                patrocinadores={datos.patrocinadores}
                asignadas={datos.asignadas}
            />

            <PanelPremios pruebaId={elegida.id} premios={datos.premios} />
        </main>
    );
}