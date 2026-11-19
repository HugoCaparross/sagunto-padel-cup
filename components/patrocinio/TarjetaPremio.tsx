import { ETIQUETAS_CUADRO } from "@/lib/constantes";
import { fechaLarga } from "@/lib/formato";
import type { PremioPublico } from "@/lib/patrocinio/publico";

function Trofeo() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 text-[#F0443A]" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
            <path d="M8 6H5a2 2 0 0 0 2 4h1M16 6h3a2 2 0 0 1-2 4h-1" />
            <path d="M12 13v4M9 20h6M10 17h4" />
        </svg>
    );
}

function Candado() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 text-[#68737D]" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
    );
}

export default function TarjetaPremio({ premio }: { premio: PremioPublico }) {
    if (!premio.revelado) {
        return (
            <article className="space-y-3 rounded-xl bg-[#F4F5F4] p-5 ring-1 ring-[#D5D9DC]">
                <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wide text-[#68737D]">
                        {ETIQUETAS_CUADRO[premio.cuadro]}
                    </span>
                    <Candado />
                </div>
                <p className="heading-font text-2xl text-[#68737D]">Sorpresa</p>
                {premio.revelaEl && (
                    <p className="text-sm text-[#68737D]">Se revela el {fechaLarga(premio.revelaEl)}</p>
                )}
            </article>
        );
    }

    return (
        <article className="space-y-3 rounded-xl bg-white p-5 ring-1 ring-[#D5D9DC]">
            <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-[#68737D]">
                    {ETIQUETAS_CUADRO[premio.cuadro]}
                </span>
                <Trofeo />
            </div>
            <p className="heading-font text-2xl leading-tight">{premio.descripcion}</p>
        </article>
    );
}