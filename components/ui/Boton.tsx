import type { ButtonHTMLAttributes } from "react";

export type VarianteBoton = "primario" | "secundario" | "claro" | "fantasma";
export type TamanoBoton = "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
    variante?: VarianteBoton;
    tamano?: TamanoBoton;
};

export default function Boton({
    variante = "primario",
    tamano = "md",
    className = "",
    type = "button",
    ...props
}: Props) {
    return (
        <button
            {...props}
            type={type}
            className={`btn btn-${variante} btn-${tamano} ${className}`.trim()}
        />
    );
}
