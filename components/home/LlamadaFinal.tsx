import Link from "next/link";

export default function LlamadaFinal() {
    return (
        <section className="bg-[#F0443A] text-white">
            <div className="container flex flex-col items-start justify-between gap-6 py-12 md:flex-row md:items-center">
                <h2 className="heading-font text-5xl">ALLÍ TE ESPERO</h2>
                <Link
                    href="/calendario"
                    className="rounded-lg bg-white px-5 py-3 text-sm font-medium text-[#0D1B2A]"
                >
                    Ver próximas pruebas
                </Link>
            </div>
        </section>
    );
}