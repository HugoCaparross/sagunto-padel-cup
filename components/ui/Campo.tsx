import { useId, type InputHTMLAttributes } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "autoComplete"> & { etiqueta: string; ayuda?: string; error?: string; requerido?: boolean; autoComplete: string };

export default function Campo({ etiqueta, ayuda, error, requerido = false, autoComplete, id, className = "", ...props }: Props) {
    const generado = useId();
    const campoId = id ?? generado;
    const ayudaId = ayuda ? `${campoId}-ayuda` : undefined;
    const errorId = error ? `${campoId}-error` : undefined;
    const describedBy = [props["aria-describedby"], ayudaId, errorId].filter(Boolean).join(" ") || undefined;
    return <div className="grid gap-2">
        <label htmlFor={campoId} className="text-sm font-semibold text-ink">{etiqueta}{requerido && <span aria-hidden="true"> *</span>}</label>
        <input {...props} id={campoId} autoComplete={autoComplete} required={requerido} aria-invalid={error ? true : props["aria-invalid"]} aria-describedby={describedBy} className={`campo-base ${error ? "campo-error" : ""} ${className}`.trim()} />
        {ayuda && <p id={ayudaId} className="text-sm text-muted">{ayuda}</p>}
        {error && <p id={errorId} className="text-sm font-medium text-error-texto">{error}</p>}
    </div>;
}
