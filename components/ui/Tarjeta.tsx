import type { HTMLAttributes, ReactNode } from "react";

type Props = HTMLAttributes<HTMLElement> & { as?: "article" | "section" | "div"; interactiva?: boolean; children: ReactNode };

export default function Tarjeta({ as: Element = "article", interactiva = false, className = "", children, ...props }: Props) {
    const tabIndex = interactiva ? props.tabIndex ?? 0 : props.tabIndex;
    return <Element {...props} tabIndex={tabIndex} className={`tarjeta ${interactiva ? "tarjeta-interactiva" : ""} ${className}`.trim()}>{children}</Element>;
}
