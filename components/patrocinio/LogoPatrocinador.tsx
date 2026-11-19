import type { PatrocinadorPublico } from "@/lib/patrocinio/publico";

type Props = {
    patrocinador: PatrocinadorPublico;
    grande?: boolean;
};

// En escala de grises; recupera el color al pasar el cursor.
export default function LogoPatrocinador({ patrocinador: p, grande = false }: Props) {
    const imagen = (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={p.logoUrl}
            alt={p.nombre}
            loading="lazy"
            className={`${grande ? "h-16" : "h-10"} w-auto max-w-full object-contain grayscale transition duration-300 hover:grayscale-0`}
        />
    );

    const contenido = (
        <div className="flex h-full min-h-[96px] items-center justify-center p-4">{imagen}</div>
    );

    if (!p.webUrl) {
        return <div className="h-full rounded-lg bg-white ring-1 ring-[#D5D9DC]">{contenido}</div>;
    }

    return (
        <a
            href={p.webUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${p.nombre} (se abre en otra pestaña)`}
            className="block h-full rounded-lg bg-white ring-1 ring-[#D5D9DC] hover:ring-[#0D1B2A]"
        >
            {contenido}
        </a>
    );
}