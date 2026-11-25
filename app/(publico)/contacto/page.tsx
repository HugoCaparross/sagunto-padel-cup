import type { Metadata } from "next";
import FormularioContacto from "@/components/contacto/FormularioContacto";
import { usuarioActual } from "@/lib/auth/organizador";
import type { TipoContacto } from "@/lib/validadores/contacto";

export const metadata: Metadata = { title: "Contacto" };

type Props = { searchParams: Promise<{ tipo?: string }> };

export default async function PaginaContacto({ searchParams }: Props) {
  const { tipo } = await searchParams;
  const logueado = (await usuarioActual()) !== null;
  const tipoInicial: TipoContacto = tipo === "patrocinio" ? "patrocinio" : "consulta";

  return (
    <main className="mx-auto max-w-[640px] space-y-6 px-4 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Contacto</h1>
        <p className="text-muted">
          Escríbenos para consultas sobre el circuito o para dejar una sugerencia.
          Las sugerencias requieren iniciar sesión.
        </p>
      </header>

      <FormularioContacto logueado={logueado} tipoInicial={tipoInicial} />
    </main>
  );
}
