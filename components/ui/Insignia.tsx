import type { HTMLAttributes, ReactNode } from "react";

type Tono = "neutro" | "coral" | "navy" | "sage" | "exito" | "aviso" | "error";
const TONOS: Record<Tono, string> = { neutro: "insignia-neutro", coral: "insignia-coral", navy: "insignia-navy", sage: "insignia-sage", exito: "insignia-exito", aviso: "insignia-aviso", error: "insignia-error" };

export default function Insignia({ tono = "neutro", className = "", children, ...props }: HTMLAttributes<HTMLSpanElement> & { tono?: Tono; children: ReactNode }) {
    return <span {...props} className={`insignia ${TONOS[tono]} ${className}`.trim()}>{children}</span>;
}
