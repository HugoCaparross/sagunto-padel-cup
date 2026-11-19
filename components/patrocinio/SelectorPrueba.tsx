import Link from "next/link";
import type { PruebaSelector } from "@/lib/patrocinio/publico";

type Props = {
    pruebas: PruebaSelector[];
    activaId: string;
    ruta: string;
};

export default function SelectorPrueba({ pruebas, activaId, ruta }: Props) {
    return (
        <nav aria-label="Pruebas" className="flex flex-wrap gap-2">
            {pruebas.map((p) => (
                <Link
                    key={p.id}
                    href={`${ruta}?prueba=${p.slug}`}
                    aria-current={p.id === activaId ? "page" : undefined}
                    className={`rounded-md px-3 py-1.5 text-sm ${p.id === activaId ? "bg-[#0D1B2A] text-white" : "bg-white ring-1 ring-[#D5D9DC]"
                        }`}
                >
                    {p.nombre}
                </Link>
            ))}
        </nav>
    );
}