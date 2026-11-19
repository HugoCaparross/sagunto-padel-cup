import type { Metadata } from "next";
import { NuevaContrasenaForm } from "@/components/auth/FormularioAuth";

export const metadata: Metadata = { title: "Nueva contraseña" };

export default function PaginaNuevaContrasena() {
    return (
        <main className="mx-auto max-w-sm space-y-6 px-4 py-16">
            <h1 className="text-2xl font-semibold">Nueva contraseña</h1>
            <NuevaContrasenaForm />
        </main>
    );
}