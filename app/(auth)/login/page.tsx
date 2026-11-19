import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/FormularioAuth";

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
        <p className="rounded-lg bg-[#FFF4DE] p-3 text-sm text-[#B77912]">
          El enlace ha caducado o no es válido. Vuelve a intentarlo.
        </p>
      )}
      <LoginForm siguiente={siguiente} />
    </main>
  );
}