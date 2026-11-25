import { obtenerDatosHorarios } from "@/actions/horarios";
import EditorHorarios from "@/components/horarios/EditorHorarios";

type Props = {
    params: Promise<{ id: string }>;
};

export default async function PaginaHorarios({ params }: Props) {
    const { id } = await params;
    const res = await obtenerDatosHorarios({ pruebaId: id });

    return (
        <main className="p-6">
            {res.ok ? (
                <EditorHorarios pruebaId={id} datos={res.datos} />
            ) : (
                <p className="text-[var(--color-danger)]">{res.error}</p>
            )}
        </main>
    );
}