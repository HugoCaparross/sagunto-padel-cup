"use client";

import Link from "next/link";
import { useState } from "react";
import { CATEGORIAS, ETIQUETAS_CATEGORIA, ETIQUETAS_ESTADO_PRUEBA } from "@/lib/constantes";
import type { PruebaPublica } from "@/lib/pruebas/publico";
import { fechaLarga } from "@/lib/formato";
import { formatoFechaInscripcion } from "@/lib/pruebas/fechas-clave";
import GoogleIcon from "@/components/ui/GoogleIcon";
import s from "./page.module.css";

const OPCIONES_ESTADO = [
  { valor: "todas", etiqueta: "Todas las pruebas" },
  { valor: "proximas", etiqueta: "Por disputar" },
  { valor: "finalizadas", etiqueta: "Finalizadas" },
];

export default function CalendarBrowser({ pruebas }: { pruebas: PruebaPublica[] }) {
  const [categoria, setCategoria] = useState("todas");
  const [estado, setEstado] = useState("todas");
  const visibles = pruebas.filter((prueba) =>
    (categoria === "todas" || prueba.categorias.includes(categoria as PruebaPublica["categorias"][number])) &&
    (estado === "todas" || (estado === "finalizadas" ? prueba.estado === "finalizada" : prueba.estado !== "finalizada"))
  );

  return <div className={s.browser}>
    <header className={s.browserCabecera}>
      <div><p className={s.eyebrowOscuro}>Explora las pruebas</p><h2>Calendario del circuito</h2><p>Filtra por categoría o estado y abre una prueba para ver todos sus detalles.</p></div>
      <div className={s.filtros}>
        <label className={s.selector} htmlFor="filtro-categoria"><span className={s.selectorEtiqueta}>Categoría</span>
          <select id="filtro-categoria" value={categoria} onChange={(event) => setCategoria(event.target.value)}>
            <option value="todas">Todas las categorías</option>
            {CATEGORIAS.map((item) => <option value={item} key={item}>{ETIQUETAS_CATEGORIA[item]}</option>)}
          </select>
        </label>
        <label className={s.selector} htmlFor="filtro-estado"><span className={s.selectorEtiqueta}>Estado</span>
          <select id="filtro-estado" value={estado} onChange={(event) => setEstado(event.target.value)}>
            {OPCIONES_ESTADO.map((item) => <option value={item.valor} key={item.valor}>{item.etiqueta}</option>)}
          </select>
        </label>
      </div>
    </header>

    <p className={s.cuentaPruebas} role="status" aria-live="polite"><strong>{visibles.length}</strong> {visibles.length === 1 ? "prueba" : "pruebas"} mostradas</p>
    {visibles.length > 0 ? <ol className={s.listaPruebas}>
      {visibles.map((prueba) => {
        const apertura = prueba.inscripcionesAbrenAt;
        const cierre = prueba.inscripcionesCierranAt;
        const torneo = prueba.fechaInicio === prueba.fechaFin ? fechaLarga(prueba.fechaInicio) : `${fechaLarga(prueba.fechaInicio)} – ${fechaLarga(prueba.fechaFin)}`;
        return <li key={prueba.id}>
          <Link href={`/pruebas/${prueba.slug}`} className={s.tarjetaPrueba}>
            <header className={s.tarjetaCabecera}><div><p className={s.tarjetaEyebrow}>{prueba.esMaster ? "Máster Final" : "Prueba del circuito"}</p><h3>{prueba.nombre}</h3></div><span className={s.estadoPrueba} data-estado={prueba.estado}>{ETIQUETAS_ESTADO_PRUEBA[prueba.estado]}</span></header>
            <div className={s.hitos}>
              <div className={`${s.hito} ${s.hitoApertura}`}><span className={s.hitoIcono}><GoogleIcon name="event_available" /></span><span className={s.hitoTexto}><span className={s.hitoEtiqueta}>Apertura de inscripciones</span>{apertura ? <time dateTime={apertura}>{formatoFechaInscripcion(apertura)}</time> : <span>{formatoFechaInscripcion(apertura)}</span>}<small>{apertura ? "Fecha indicada por la organización" : "La organización la anunciará"}</small></span></div>
              <div className={s.hito}><span className={s.hitoIcono}><GoogleIcon name="event" /></span><span className={s.hitoTexto}><span className={s.hitoEtiqueta}>Cierre de inscripciones</span>{cierre ? <time dateTime={cierre}>{formatoFechaInscripcion(cierre)}</time> : <span>{formatoFechaInscripcion(cierre)}</span>}<small>{cierre ? "Fecha indicada por la organización" : "La organización la anunciará"}</small></span></div>
              <div className={`${s.hito} ${s.hitoTorneo}`}><span className={s.hitoIcono}><GoogleIcon name="sports_tennis" /></span><span className={s.hitoTexto}><span className={s.hitoEtiqueta}>{prueba.fechaInicio === prueba.fechaFin ? "Día del torneo" : "Fechas del torneo"}</span><span>{torneo}</span><small>Calendario del torneo</small></span></div>
            </div>
            <footer className={s.tarjetaPie}><span><GoogleIcon name="location_on" />{prueba.sede}</span><span>{prueba.categorias.map((item) => ETIQUETAS_CATEGORIA[item]).join(" · ")}</span><span className={s.verPrueba}>Ver detalles <GoogleIcon name="arrow_forward" /></span></footer>
          </Link>
        </li>;
      })}
    </ol> : <div className={s.sinPruebas}><GoogleIcon name="event" /><h3>No hay pruebas para estos filtros</h3><p>Prueba otra categoría o estado para consultar el calendario.</p><button type="button" onClick={() => { setCategoria("todas"); setEstado("todas"); }}>Mostrar todas las pruebas</button></div>}
  </div>;
}
