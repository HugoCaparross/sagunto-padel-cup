import type { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "./login-form";

export const metadata: Metadata = {
    title: "Iniciar sesión | Sagunto Padel Cup",
    description:
        "Accede a tu área de jugador de Sagunto Padel Cup para consultar tus inscripciones, resultados y ranking individual.",
    robots: { index: false, follow: false },
};

export default function LoginPage() {
    return (
        <Suspense fallback={<main aria-busy="true" />}>
            <LoginForm />
        </Suspense>
    );
}