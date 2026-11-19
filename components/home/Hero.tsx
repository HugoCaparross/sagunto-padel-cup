import Link from "next/link";
import FondoTopografico from "@/components/brand/FondoTopografico";

type Props = { temporada: string | null };

export default function Hero({ temporada }: Props) {
    return (
        <section className="relative isolate overflow-hidden bg-[#0D1B2A] text-white">
            <FondoTopografico className="absolute inset-0 -z-10 h-full w-full text-white/10" />

            {temporada && (
                <span
                    aria-hidden="true"
                    className="heading-font pointer-events-none absolute right-4 top-4 select-none text-[64px] leading-none text-[#F0443A]/15 md:text-[120px]"
                >
                    {temporada}
                </span>
            )}

            <div className="container relative flex min-h-[70vh] flex-col justify-center gap-6 py-20">
                <p className="text-sm uppercase tracking-[0.2em] text-[#A7C4A0]">
                    Circuito amateur de pádel
                </p>
                <h1 className="heading-font text-6xl leading-[0.95] md:text-8xl">
                    SAGUNTO <span className="text-[#F0443A]">PADEL CUP</span>
                </h1>
                <p className="max-w-xl text-lg text-white/80">
                    6 pruebas + Máster Final · Sagunto y Camp de Morvedre
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                    <Link
                        href="/calendario"
                        className="rounded-lg bg-[#F0443A] px-5 py-3 text-sm font-medium text-white"
                    >
                        Inscribirme
                    </Link>
                    <Link
                        href="/circuito"
                        className="rounded-lg border border-white/30 px-5 py-3 text-sm font-medium hover:bg-white/10"
                    >
                        Ver el circuito
                    </Link>
                </div>
            </div>
        </section>
    );
}