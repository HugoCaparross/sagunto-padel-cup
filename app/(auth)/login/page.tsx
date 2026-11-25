import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/FormularioAuth";
import Aviso from "@/components/ui/Aviso";

export const metadata: Metadata = { title: "Entrar" };

type Props = {
  searchParams: Promise<{ siguiente?: string; error?: string }>;
};

export default async function PaginaLogin({ searchParams }: Props) {
  const { siguiente, error } = await searchParams;

  return (
    <main className="mx-auto max-w-sm space-y-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">Entrar</h1>
      {error === "enlace" && (
        <Aviso tipo="aviso">
          El enlace ha caducado o no es válido. Vuelve a intentarlo.
        </Aviso>
      )}
      <LoginForm siguiente={siguiente} />
    </main>
  );
}
