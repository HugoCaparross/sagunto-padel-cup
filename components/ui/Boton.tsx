
import {
    cloneElement,
    isValidElement,
    type ButtonHTMLAttributes,
    type ReactElement,
} from "react";

export type VarianteBoton =
    | "primario"
    | "secundario"
    | "claro"
    | "fantasma";

export type TamanoBoton = "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
    variante?: VarianteBoton;
    tamano?: TamanoBoton;
    asChild?: boolean;
};

type PropsElementoHijo = {
    className?: string;
    "aria-disabled"?: boolean | "true" | "false";
    [key: string]: unknown;
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
        if (!isValidElement(children)) {
            throw new Error(
                "Boton con asChild necesita un único elemento hijo."
            );
        }

        const child = children as ReactElement<PropsElementoHijo>;

        const { disabled, ...childProps } = props;

        const propiedadesHijo = {
            ...childProps,
            "aria-disabled":
                disabled || child.props["aria-disabled"] || undefined,
            className: `${clases} ${child.props.className ?? ""}`.trim(),
        } as Partial<PropsElementoHijo>;

        return cloneElement(child, propiedadesHijo);
    }

    return (
        <button
            {...props}
            type={type}
            aria-disabled={
                props.disabled || props["aria-disabled"] || undefined
            }
            className={clases}
        >
            {children}
        </button>
    );
}
