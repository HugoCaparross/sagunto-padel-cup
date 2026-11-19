import Link from "next/link";
import type { NoticiaPublica } from "@/actions/noticias";
import { fechaLarga } from "@/lib/formato";
import { ETIQUETAS_NOTICIA } from "@/lib/validadores/noticias";

type Props = { noticias: NoticiaPublica[] };

export default function UltimasNoticias({ noticias }: Props) {
    return (
        <section className="space-y-6">
            <div className="flex items-end justify-between gap-4">
                <h2 className="heading-font text-4xl">Noticias</h2>
                <Link href="/noticias" className="text-sm underline">
                    Todas las noticias
                </Link>
            </div>

            {noticias.length === 0 ? (
                <p className="rounded-xl bg-white p-6 text-sm text-[#68737D] ring-1 ring-[#D5D9DC]">
                    Próximamente.
                </p>
            ) : (
                <ul className="grid gap-4 md:grid-cols-3">
                    {noticias.map((n) => (
                        <li key={n.id}>
                            <Link
                                href={`/noticias/${n.slug}`}
                                className="block h-full space-y-3 rounded-xl bg-white p-5 ring-1 ring-[#D5D9DC] hover:ring-[#0D1B2A]"
                            >
                                <p className="text-xs text-[#68737D]">
                                    {ETIQUETAS_NOTICIA[n.categoria]}
                                    {n.publicadaAt && ` · ${fechaLarga(n.publicadaAt)}`}
                                </p>
                                <h3 className="font-semibold">{n.titulo}</h3>
                                <p className="text-sm text-[#68737D]">{n.resumen}</p>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}