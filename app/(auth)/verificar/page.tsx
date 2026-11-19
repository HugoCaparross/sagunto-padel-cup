import type { Metadata } from "next";

export const metadata: Metadata = { title: "Revisa tu email" };

type Props = {
  searchParams: Promise<{ tipo?: string }>;
};

export default async function PaginaVerificar({ searchParams }: Props) {
  const { tipo } = await searchParams;
  const recuperar = tipo === "recuperar";

  return (
    <main className="mx-auto max-w-sm space-y-4 px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Revisa tu email</h1>
      <p className="text-sm text-[#68737D]">
        {recuperar
          ? "Si existe una cuenta con ese email, te hemos enviado un enlace para cambiar la contraseña."
          : "Te hemos enviado un enlace para confirmar tu cuenta. Ábrelo desde este mismo dispositivo."}
      </p>
    </main>
  );
}