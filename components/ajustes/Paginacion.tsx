import Link from "next/link";

type Props = {
    pagina: number;
    total: number;
    tamano: number;
    construirHref: (pagina: number) => string;
};

export default function Paginacion({ pagina, total, tamano, construirHref }: Props) {
    const ultima = Math.max(1, Math.ceil(total / tamano));
    if (ultima <= 1) return null;

    return (
        <nav aria-label="Paginación" className="flex items-center justify-between text-sm">
            <span className="text-muted">
                Página {pagina} de {ultima} · {total} registros
            </span>
            <div className="flex gap-2">
                {pagina > 1 && (
                    <Link href={construirHref(pagina - 1)} className="btn btn-fantasma">Anterior</Link>
                )}
                {pagina < ultima && (
                    <Link href={construirHref(pagina + 1)} className="btn btn-fantasma">Siguiente</Link>
                )}
            </div>
        </nav>
    );
}