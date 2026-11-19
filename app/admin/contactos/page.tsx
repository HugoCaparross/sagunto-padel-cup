import Link from "next/link";
import { listarContactos } from "@/actions/contacto";
import BandejaContactos from "@/components/contacto/BandejaContactos";
import {
    ESTADOS_CONTACTO,
    ETIQUETAS_ESTADO_CONTACTO,
    type EstadoContacto,
} from "@/lib/validadores/contacto";

type Props = {
    searchParams: Promise<{ estado?: string }>;
};

export default async function PaginaContactos({ searchParams }: Props) {
    const { estado } = await searchParams;
    const filtro = (ESTADOS_CONTACTO as readonly string[]).includes(estado ?? "")
        ? (estado as EstadoContacto)
        : undefined;

    const res = await listarContactos(filtro ? { estado: filtro } : {});
    if (!res.ok) return <p className="p-6 text-[#C73535]">{res.error}</p>;

    const opciones: { valor: EstadoContacto | null; texto: string }[] = [
        { valor: null, texto: "Todas" },
        ...ESTADOS_CONTACTO.map((e) => ({ valor: e, texto: ETIQUETAS_ESTADO_CONTACTO[e] })),
    ];

    return (
        <main className="space-y-6 p-6">
            <header className="space-y-3">
                <h1 className="text-2xl font-semibold">Contactos</h1>
                <nav className="flex flex-wrap gap-2">
                    {opciones.map((o) => {
                        const activo = (o.valor ?? null) === (filtro ?? null);
                        return (
                            <Link
                                key={o.texto}
                                href={o.valor ? `?estado=${o.valor}` : "?"}
                                className={`rounded-md px-3 py-1 text-sm ${activo ? "bg-[#0D1B2A] text-white" : "bg-white ring-1 ring-[#D5D9DC]"
                                    }`}
                            >
                                {o.texto}
                            </Link>
                        );
                    })}
                </nav>
            </header>

            <BandejaContactos filas={res.filas} />
        </main>
    );
}