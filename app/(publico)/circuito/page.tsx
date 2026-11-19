import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "El circuito" };

const FORMATO = [
    { titulo: "Grupos", texto: "Hasta 5 parejas juegan en un grupo. Desde 6, se forman dos grupos." },
    { titulo: "Fase final", texto: "Según el número de parejas, se organizan los cuadros de oro, plata y bronce." },
    { titulo: "Máster Final", texto: "Las mejores parejas de cada categoría se clasifican para la gran final de temporada." },
];

export default function PaginaCircuito() {
    return (
        <main className="container space-y-16 py-12">
            <header className="max-w-2xl space-y-4">
                <h1 className="heading-font text-6xl">El circuito</h1>
                <p className="text-lg text-[#68737D]">
                    Sagunto Padel Cup es un circuito amateur de pádel en la comarca del Camp de Morvedre.
                    Seis pruebas a lo largo de la temporada y un Máster Final que reúne a las mejores parejas.
                </p>
            </header>

            <section className="space-y-6">
                <h2 className="heading-font text-4xl">Cómo funciona</h2>
                <ol className="grid gap-4 md:grid-cols-3">
                    {FORMATO.map((f, i) => (
                        <li key={f.titulo} className="space-y-3 rounded-xl bg-white p-6 ring-1 ring-[#D5D9DC]">
                            <span className="heading-font text-4xl text-[#F0443A]">{i + 1}</span>
                            <h3 className="font-semibold">{f.titulo}</h3>
                            <p className="text-sm text-[#68737D]">{f.texto}</p>
                        </li>
                    ))}
                </ol>
            </section>

            <section className="max-w-2xl space-y-4">
                <h2 className="heading-font text-4xl">Cuadros</h2>
                <p>
                    Al terminar la fase de grupos, las parejas se reparten en tres cuadros. El{" "}
                    <strong>oro</strong> reúne a las parejas con más opciones de título, el{" "}
                    <strong>plata</strong> a las que llegan a la fase final desde posiciones intermedias y el{" "}
                    <strong>bronce</strong> al resto de parejas, que siguen jugando hasta el final.
                </p>
                <p>
                    Cada cuadro tiene su propio campeón, así que cualquier pareja tiene algo que jugarse en su
                    categoría.
                </p>
            </section>

            <section className="max-w-2xl space-y-4">
                <h2 className="heading-font text-4xl">Race al Máster</h2>
                <p>
                    Los puntos se acumulan durante los últimos 12 meses. Las parejas mejor clasificadas en cada
                    categoría, con un mínimo de dos pruebas disputadas, se clasifican directamente para el Máster
                    Final.
                </p>
                <Link href="/puntos" className="inline-block text-sm underline">
                    Ver el sistema de puntos
                </Link>
            </section>

            <section className="rounded-2xl bg-[#0D1B2A] p-8 text-white">
                <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                    <div className="space-y-2">
                        <h2 className="heading-font text-3xl">¿Listo para jugar?</h2>
                        <p className="text-white/70">Consulta el calendario y elige tu próxima prueba.</p>
                    </div>
                    <Link
                        href="/calendario"
                        className="rounded-lg bg-[#F0443A] px-5 py-3 text-sm font-medium text-white"
                    >
                        Ver calendario
                    </Link>
                </div>
            </section>
        </main>
    );
}