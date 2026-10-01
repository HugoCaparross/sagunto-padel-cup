"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { createTournamentAction } from "./actions";

type TournamentFormProps = {
    children: ReactNode;
    className: string;
    errorClassName: string;
};

export default function TournamentForm({
    children,
    className,
    errorClassName,
}: TournamentFormProps) {
    const [state, formAction] = useActionState(
        createTournamentAction,
        {},
    );

    return (
        <form action={formAction} className={className}>
            {state.error && (
                <p role="alert" aria-live="polite" className={errorClassName}>
                    {state.error}
                </p>
            )}
            {children}
        </form>
    );
}

type TournamentSubmitButtonProps = {
    className: string;
    disabled?: boolean;
};

export function TournamentSubmitButton({
    className,
    disabled = false,
}: TournamentSubmitButtonProps) {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            className={className}
            disabled={disabled || pending}
        >
            {pending ? "Creando torneo…" : "Crear torneo"}
        </button>
    );
}
