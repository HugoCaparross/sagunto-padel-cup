import Link from "next/link";
import type { NoticiaPublica } from "@/actions/noticias";
import { fechaLarga } from "@/lib/formato";
import { ETIQUETAS_NOTICIA } from "@/lib/validadores/noticias";

export default function TarjetaNoticia({ noticia }: { noticia: NoticiaPublica }) {
    return (
        <Link
            href={`/noticias/${noticia.slug}`}
            className="group flex h-full flex-col overflow-hidden rounded-xl bg-white ring-1 ring-[var(--color-border)] hover:ring-[var(--color-navy)]"
        >
            {noticia.imagenUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={noticia.imagenUrl}
                    alt=""
                    loading="lazy"
                    className="aspect-[16/9] w-full object-cover"
                />
            )}

            <div className="flex flex-1 flex-col gap-3 p-5">
                <p className="text-xs text-[var(--color-muted)]">
                    {ETIQUETAS_NOTICIA[noticia.categoria]}
                    {noticia.publicadaAt && ` · ${fechaLarga(noticia.publicadaAt)}`}
                </p>
                <h2 className="heading-font text-2xl leading-tight group-hover:underline">
                    {noticia.titulo}
                </h2>
                <p className="text-sm text-[var(--color-muted)]">{noticia.resumen}</p>
            </div>
        </Link>
    );
}