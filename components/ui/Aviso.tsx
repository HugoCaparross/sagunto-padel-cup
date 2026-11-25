import type { ReactNode } from "react";

type Props = {
    tipo: "error" | "exito" | "aviso" | "info";
    children: ReactNode;
    className?: string;
    titulo?: string;
};

const CLASE: Record<Props["tipo"], string> = {
    error: "alerta-error",
    exito: "alerta-exito",
    aviso: "alerta-aviso",
    info: "alerta-info",
};

export default function Aviso({ tipo, children, className = "", titulo }: Props) {
    return (
        <div role={tipo === "error" ? "alert" : "status"} className={`alerta ${CLASE[tipo]} ${className}`.trim()}>
            {titulo && <p className="mb-1 font-semibold">{titulo}</p>}
            <div>{children}</div>
        </div>
    );
}
