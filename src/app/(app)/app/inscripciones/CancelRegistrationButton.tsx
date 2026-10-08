"use client";

import { useTransition } from "react";
import { XCircle } from "lucide-react";

import {
    cancelMyRegistrationAction,
} from "./actions";

import styles from "./page.module.css";

type Props = {
    registrationId: string;
};

export default function CancelRegistrationButton({
    registrationId,
}: Props) {
    const [
        isPending,
        startTransition,
    ] = useTransition();

    function handleCancel() {
        const confirmed =
            window.confirm(
                "¿Seguro que quieres cancelar esta inscripción?",
            );

        if (!confirmed) {
            return;
        }

        const formData =
            new FormData();

        formData.set(
            "registrationId",
            registrationId,
        );

        startTransition(
            async () => {
                await cancelMyRegistrationAction(
                    formData,
                );
            },
        );
    }

    return (
        <button
            type="button"
            className={
                styles.cancelButton
            }
            onClick={handleCancel}
            disabled={isPending}
            aria-disabled={isPending}
        >
            <XCircle
                size={14}
                aria-hidden="true"
            />

            {isPending
                ? "Cancelando…"
                : "Cancelar inscripción"}
        </button>
    );
}