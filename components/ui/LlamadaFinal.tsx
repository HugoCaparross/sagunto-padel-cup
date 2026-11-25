import type { ReactNode } from "react";

type Props = { titulo: string; texto: string; cta: ReactNode };

export default function LlamadaFinal({ titulo, texto, cta }: Props) {
    return <section className="llamada-final">
        <div className="container py-12 md:py-16 lg:py-20">
            <h2 className="spc-h2 text-balance">{titulo}</h2>
            <p className="mt-4 max-w-2xl spc-cuerpo">{texto}</p>
            <div className="mt-6">{cta}</div>
        </div>
    </section>;
}
