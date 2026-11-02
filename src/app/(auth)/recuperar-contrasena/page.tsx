import type { Metadata } from "next";
import RecoveryForm from "./recovery-form";

export const metadata: Metadata = {
    title: "Recuperar contraseña | Sagunto Padel Cup",
    robots: { index: false, follow: false },
};

export default function RecoverPasswordPage() {
    return <RecoveryForm />;
}