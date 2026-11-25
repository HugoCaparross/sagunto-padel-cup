import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href: string;
    variante?: "texto" | "boton";
    externo?: boolean;
    children: ReactNode;
};

export default function Enlace({ href, variante = "texto", externo = false, className = "", children, ...props }: Props) {
    const clases = `${variante === "boton" ? "btn btn-primario" : "enlace-texto"} ${className}`.trim();
    if (externo) return <a {...props} href={href} target="_blank" rel="noopener noreferrer" className={clases}>{children}<span className="sr-only"> (se abre en una web nueva)</span></a>;
    return <Link {...props} href={href} className={clases}>{children}</Link>;
}
