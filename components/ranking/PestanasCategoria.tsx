import Link from "next/link";
import { CATEGORIAS, ETIQUETAS_CATEGORIA, type Categoria } from "@/lib/constantes";
import s from "./PestanasCategoria.module.css";

type Props = { activa: Categoria; corte: string };

export default function PestanasCategoria({ activa, corte }: Props) {
  return (
    <nav aria-label="Categorías del ranking" className={s.tabs}>
      {CATEGORIAS.map((categoria) => (
        <Link
          key={categoria}
          href={`/ranking?categoria=${categoria}&corte=${corte}#clasificacion`}
          aria-current={categoria === activa ? "page" : undefined}
          className={s.tab}
          data-active={categoria === activa || undefined}
        >
          {ETIQUETAS_CATEGORIA[categoria]}
        </Link>
      ))}
    </nav>
  );
}
