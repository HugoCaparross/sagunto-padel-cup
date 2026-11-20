import type { Cifras } from "@/lib/home/datos";
import GoogleIcon, { type GoogleIconName } from "@/components/ui/GoogleIcon";
import s from "./home.module.css";

type Props = { cifras: Cifras };

export default function FranjaCifras({ cifras }: Props) {
    const items: { valor: number; etiqueta: string; icono: GoogleIconName }[] = [
        { valor: cifras.jugadores, etiqueta: "Jugadores activos", icono: "groups" },
        { valor: cifras.parejas, etiqueta: "Parejas inscritas esta temporada", icono: "group" },
        { valor: cifras.pruebas, etiqueta: "Pruebas en el circuito", icono: "calendar_month" },
        { valor: cifras.categorias, etiqueta: "Categorías", icono: "category" },
    ];

    return (
        <section aria-label="Cifras del circuito" className={s.cifrasBarra}>
            <dl className={`container ${s.cifrasGrid}`}>
                {items.map((i) => (
                    <div key={i.etiqueta} className={s.cifra}>
                        <span className={s.cifraIcono}>
                            <GoogleIcon name={i.icono} />
                        </span>
                        <div className={s.cifraContenido}>
                            <dt className={s.cifraEtiqueta}>{i.etiqueta}</dt>
                            <dd className={s.cifraValor}>{i.valor.toLocaleString("es-ES")}</dd>
                        </div>
                    </div>
                ))}
            </dl>
        </section>
    );
}