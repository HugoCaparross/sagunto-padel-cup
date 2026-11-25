import Link from "next/link";
import type { FilaRankingPublica } from "@/lib/ranking/publico";
import s from "./TablaRankingPublica.module.css";

type Props = { filas: FilaRankingPublica[] };

export default function TablaRankingPublica({ filas }: Props) {
  if (filas.length === 0) return null;

  return (
    <div className={s.tableWrap}>
      <table className={s.table}>
        <caption className={s.srOnly}>Clasificación completa, con resultados y estadísticas individuales</caption>
        <thead>
          <tr>
            <th scope="col">Pos.</th>
            <th scope="col">Jugador</th>
            <th scope="col" className={s.numeric}>Puntos</th>
            <th scope="col" className={s.numeric}>Pruebas</th>
            <th scope="col" className={s.numeric}>Partidos</th>
            <th scope="col" className={s.numeric}>Victorias</th>
            <th scope="col" className={s.numeric}>% victorias</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={fila.clave} data-leader={fila.posicion === 1 || undefined}>
              <td data-label="Posición" className={s.position}>{fila.posicion}<span className={s.ordinal}>.º</span></td>
              <td data-label="Jugador" className={s.player}>
                {fila.enlace ? <Link href={fila.enlace}>{fila.nombre}</Link> : <span>{fila.nombre}</span>}
              </td>
              <td data-label="Puntos" className={`${s.numeric} ${s.points}`}>{fila.puntos}</td>
              <td data-label="Pruebas" className={s.numeric}>{fila.pruebasJugadas}</td>
              <td data-label="Partidos" className={s.numeric}>{fila.partidos}</td>
              <td data-label="Victorias" className={s.numeric}>{fila.victorias}</td>
              <td data-label="% victorias" className={s.numeric}>{fila.porcentajeVictorias}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
