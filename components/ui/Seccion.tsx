import type { ReactNode } from "react";

type Props = { variante?: "clara" | "alterna" | "oscura"; titulo?: string; descripcion?: string; id?: string; className?: string; children: ReactNode };

export default function Seccion({ variante = "clara", titulo, descripcion, id, className = "", children }: Props) {
    return <section id={id} className={`seccion seccion-${variante} ${className}`.trim()}>
        <div className="container">
            {(titulo || descripcion) && <header className="mb-8 grid gap-3">
                {titulo && <h2 className="spc-h2 text-balance">{titulo}</h2>}
                {descripcion && <p className="max-w-2xl spc-cuerpo text-muted">{descripcion}</p>}
            </header>}
            {children}
        </div>
    </section>;
}
