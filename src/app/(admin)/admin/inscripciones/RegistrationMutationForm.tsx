"use client";

import type { FormEvent, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import styles from "../admin-list.module.css";

function SubmitButton({ children }: { children: ReactNode }) {
    const { pending } = useFormStatus();
    return <button className={styles.smallButton} type="submit" disabled={pending}>{pending ? "Procesando…" : children}</button>;
}

export default function RegistrationMutationForm({
    action,
    registrationId,
    returnTo,
    confirmation,
    children,
}: {
    action: (formData: FormData) => void | Promise<void>;
    registrationId: string;
    returnTo: string;
    confirmation: string;
    children: ReactNode;
}) {
    function confirmMutation(event: FormEvent<HTMLFormElement>) {
        if (!window.confirm(confirmation)) event.preventDefault();
    }

    return <form action={action} onSubmit={confirmMutation}>
        <input type="hidden" name="registrationId" value={registrationId} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <SubmitButton>{children}</SubmitButton>
    </form>;
}
