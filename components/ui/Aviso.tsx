import type { ReactNode } from "react";

type Props = {
    tipo: "error" | "exito" | "aviso";
    children: ReactNode;
    className?: string;
};

const CLASE: Record<Props["tipo"], string> = {
    error: "alerta-error",
    exito: "alerta-exito",
    aviso: "alerta-aviso",
};

export default function Aviso({ tipo, children, className = "" }: Props) {
    return (
        <p role={tipo === "error" ? "alert" : "status"} className={`alerta ${CLASE[tipo]} ${className}`.trim()}>
            {children}
        </p>
    );
}
