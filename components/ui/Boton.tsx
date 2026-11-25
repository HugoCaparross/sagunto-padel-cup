import { cloneElement, isValidElement, type ButtonHTMLAttributes, type ReactElement } from "react";

export type VarianteBoton = "primario" | "secundario" | "claro" | "fantasma";
export type TamanoBoton = "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
    variante?: VarianteBoton;
    tamano?: TamanoBoton;
    asChild?: boolean;
};

export default function Boton({
    variante = "primario",
    tamano = "md",
    asChild = false,
    className = "",
    type = "button",
    children,
    ...props
}: Props) {
    const clases = `btn btn-${variante} btn-${tamano} ${className}`.trim();
    if (asChild) {
        if (!isValidElement(children)) throw new Error("Boton con asChild necesita un único elemento hijo.");
        const child = children as ReactElement<{ className?: string }>;
        const { disabled, ...childProps } = props;
        return cloneElement(child, { ...childProps, "aria-disabled": disabled || childProps["aria-disabled"], className: `${clases} ${child.props.className ?? ""}`.trim() });
    }
    return (
        <button
            {...props}
            type={type}
            aria-disabled={props.disabled || props["aria-disabled"] || undefined}
            className={clases}
        >{children}</button>
    );
}
