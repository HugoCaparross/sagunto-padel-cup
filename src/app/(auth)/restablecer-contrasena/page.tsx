import type { Metadata } from "next";
import ResetPasswordForm from "./reset-password-form";

export const metadata: Metadata = {
    title: "Crear nueva contraseña | Sagunto Padel Cup",
    robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
    return <ResetPasswordForm />;
}