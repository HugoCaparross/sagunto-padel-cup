import Link from "next/link";
import type { FilaRankingPublica } from "@/lib/ranking/publico";
import s from "./PodioRanking.module.css";

export default function PodioRanking({ filas }: { filas: FilaRankingPublica[] }) {
  if (filas.length === 0) {
    return (
      <div className={s.empty}>
        <span className={s.emptyIndex}>RTM / CLASIFICACIÓN</span>
        <h4>La carrera empieza en la pista.</h4>
        <p>Cuando se publiquen resultados para esta categoría y fecha, aquí aparecerán las primeras posiciones.</p>
      </div>
    );
  }

  return (
    <ol className={s.podium} aria-label="Tres primeras posiciones">
      {filas.map((fila, index) => (
        <li key={fila.clave} className={`${s.place} ${index === 0 ? s.first : ""}`}>
          <div className={s.placeTop}><span>0{fila.posicion}</span><span>{index === 0 ? "LÍDER" : "POSICIÓN"}</span></div>
          {fila.enlace ? <Link className={s.name} href={fila.enlace}>{fila.nombre}</Link> : <span className={s.name}>{fila.nombre}</span>}
          <div className={s.points}><strong>{fila.puntos}</strong><span>puntos</span></div>
          <div className={s.details}><span>{fila.pruebasJugadas} {fila.pruebasJugadas === 1 ? "prueba" : "pruebas"}</span><span>{fila.victorias} {fila.victorias === 1 ? "victoria" : "victorias"}</span></div>
        </li>
      ))}
    </ol>
  );
}
