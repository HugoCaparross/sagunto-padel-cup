import type { PatrocinadorPublico } from "@/lib/patrocinio/publico";

type Props = {
    patrocinador: PatrocinadorPublico;
    grande?: boolean;
};

export default function LogoPatrocinador({ patrocinador: p, grande = false }: Props) {
    const identidad = p.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={p.logoUrl}
            alt=""
            loading="lazy"
            className={`${grande ? "h-16" : "h-12"} w-auto max-w-full object-contain`}
        />
    ) : (
        <span className="px-3 text-center text-sm font-semibold text-navy">{p.nombre}</span>
    );

    const contenido = (
        <div className="flex h-full min-h-[120px] items-center justify-center border-b border-border bg-white p-4">{identidad}</div>
    );

    if (!p.webUrl) {
        return <div className="h-full rounded-lg bg-white ring-1 ring-border">{contenido}<span className="block px-3 py-3 text-center text-sm font-medium text-ink">{p.nombre}</span></div>;
    }

    return (
        <a
            href={p.webUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${p.nombre} (se abre en otra pestaña)`}
            className="block h-full rounded-lg bg-white ring-1 ring-border transition hover:-translate-y-0.5 hover:ring-navy"
        >
            {contenido}<span className="block px-3 py-3 text-center text-sm font-medium text-ink">{p.nombre}</span>
        </a>
    );
}
