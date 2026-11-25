"use client";

import { useState } from "react";
import {
  CATEGORIAS,
  CUADROS,
  ETIQUETAS_CATEGORIA,
  ETIQUETAS_CUADRO,
  ETIQUETAS_RONDA,
  RONDAS,
  type Categoria,
  type Cuadro,
  type Ronda,
} from "@/lib/constantes";
import { puntosPara } from "@/lib/puntos/escala";
import s from "./SimuladorPuntos.module.css";

export default function SimuladorPuntos() {
  const [categoria, setCategoria] = useState<Categoria>("segunda");
  const [cuadro, setCuadro] = useState<Cuadro>("oro");
  const [ronda, setRonda] = useState<Ronda>("semifinalista");
  const puntos = puntosPara(categoria, cuadro, ronda);

  return (
    <div className={s.simulator}>
      <div className={s.controls}>
        <label htmlFor="sim-categoria"><span>Categoría</span><select id="sim-categoria" value={categoria} onChange={(event) => setCategoria(event.target.value as Categoria)}>
          {CATEGORIAS.map((value) => <option key={value} value={value}>{ETIQUETAS_CATEGORIA[value]}</option>)}
        </select></label>
        <label htmlFor="sim-cuadro"><span>Cuadro</span><select id="sim-cuadro" value={cuadro} onChange={(event) => setCuadro(event.target.value as Cuadro)}>
          {CUADROS.map((value) => <option key={value} value={value}>{ETIQUETAS_CUADRO[value]}</option>)}
        </select></label>
        <label htmlFor="sim-ronda"><span>Ronda alcanzada</span><select id="sim-ronda" value={ronda} onChange={(event) => setRonda(event.target.value as Ronda)}>
          {RONDAS.map((value) => <option key={value} value={value}>{ETIQUETAS_RONDA[value]}</option>)}
        </select></label>
      </div>

      <div className={s.result} aria-live="polite" aria-atomic="true">
        <div className={s.resultCopy}>
          <span className={s.resultLabel}>Resultado de la simulación</span>
          <strong>{ETIQUETAS_CATEGORIA[categoria]} · {ETIQUETAS_CUADRO[cuadro]} · {ETIQUETAS_RONDA[ronda]}</strong>
          <span className={s.individual}>Puntos que recibe cada jugador</span>
        </div>
        <div className={s.resultValue}><strong>{puntos}</strong><span>PTS</span></div>
      </div>
      <p className={s.note}>El simulador consulta la escala oficial del circuito.</p>
    </div>
  );
}
