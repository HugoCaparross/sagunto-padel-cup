import Link from "next/link";
import { CATEGORIAS, ETIQUETAS_CATEGORIA, type Categoria } from "@/lib/constantes";

type Props = {
    activa: Categoria;
    corte: string;
};

// Las pestañas son enlaces para que la categoría quede en la URL y se pueda compartir.
export default function PestanasCategoria({ activa, corte }: Props) {
    return (
        <nav aria-label="Categorías" className="flex flex-wrap gap-2">
            {CATEGORIAS.map((c) => (
                <Link
                    key={c}
                    href={`/ranking?categoria=${c}&corte=${corte}`}
                    aria-current={c === activa ? "page" : undefined}
                    className={`rounded-md px-3 py-1.5 text-sm ${c === activa ? "bg-[#0D1B2A] text-white" : "bg-white ring-1 ring-[#D5D9DC] hover:bg-[#F4F5F4]"
                        }`}
                >
                    {ETIQUETAS_CATEGORIA[c]}
                </Link>
            ))}
        </nav>
    );
}