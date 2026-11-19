import type { Metadata } from "next";
import Link from "next/link";
import { FAQ } from "@/lib/contenido/faq";

export const metadata: Metadata = { title: "Preguntas frecuentes" };

export default function PaginaFaq() {
  return (
    <main className="container space-y-12 py-12">
      <header className="max-w-2xl space-y-4">
        <h1 className="heading-font text-6xl">Preguntas frecuentes</h1>
        <p className="text-lg text-[#68737D]">
          Si no encuentras la respuesta, escríbenos desde la{" "}
          <Link href="/contacto" className="underline">
            página de contacto
          </Link>
          .
        </p>
      </header>

      {FAQ.map((grupo) => (
        <section key={grupo.titulo} className="max-w-3xl space-y-4">
          <h2 className="heading-font text-3xl">{grupo.titulo}</h2>
          <div className="divide-y divide-[#D5D9DC] overflow-hidden rounded-xl bg-white ring-1 ring-[#D5D9DC]">
            {grupo.preguntas.map((p) => (
              <details key={p.pregunta} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {p.pregunta}
                  <span className="text-[#68737D] transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-[#68737D]">{p.respuesta}</p>
              </details>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}