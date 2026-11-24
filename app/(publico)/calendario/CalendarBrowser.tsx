"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CATEGORIAS, ETIQUETAS_CATEGORIA, ETIQUETAS_ESTADO_PRUEBA } from "@/lib/constantes";
import type { PruebaPublica } from "@/lib/pruebas/publico";
import { fechaAperturaInscripciones, fechaCierreInscripciones, fechaDiaPrueba, formatoFechaClave } from "@/lib/pruebas/fechas-clave";
import GoogleIcon from "@/components/ui/GoogleIcon";
import s from "./page.module.css";

type Opcion = { valor: string; etiqueta: string };
const OPCIONES_CATEGORIA: Opcion[] = [{ valor: "todas", etiqueta: "Todas las categorías" }, ...CATEGORIAS.map((categoria) => ({ valor: categoria, etiqueta: ETIQUETAS_CATEGORIA[categoria] }))];
const OPCIONES_ESTADO: Opcion[] = [{ valor: "todas", etiqueta: "Todas las pruebas" }, { valor: "proximas", etiqueta: "Por disputar" }, { valor: "finalizadas", etiqueta: "Finalizadas" }];

function Selector({ etiqueta, valor, opciones, alCambiar }: { etiqueta: string; valor: string; opciones: Opcion[]; alCambiar: (valor: string) => void }) {
  const [abierto, setAbierto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const opcionesRef = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    function cerrarFuera(evento: MouseEvent) {
      if (!raiz.current?.contains(evento.target as Node)) setAbierto(false);
    }
    function cerrarEscape(evento: KeyboardEvent) {
      if (evento.key === "Escape") setAbierto(false);
    }
    document.addEventListener("mousedown", cerrarFuera);
    document.addEventListener("keydown", cerrarEscape);
    return () => {
      document.removeEventListener("mousedown", cerrarFuera);
      document.removeEventListener("keydown", cerrarEscape);
    };
  }, []);

  const actual = opciones.find((opcion) => opcion.valor === valor)?.etiqueta ?? opciones[0]?.etiqueta;
  return <div className={s.selector} ref={raiz}>
    <span className={s.selectorEtiqueta}>{etiqueta}</span>
    <button type="button" className={s.selectorBoton} aria-haspopup="listbox" aria-expanded={abierto} onClick={() => setAbierto(!abierto)} onKeyDown={(evento) => {
      if (evento.key === "ArrowDown" || evento.key === "Enter" || evento.key === " ") {
        evento.preventDefault();
        setAbierto(true);
        requestAnimationFrame(() => opcionesRef.current[Math.max(0, opciones.findIndex((opcion) => opcion.valor === valor))]?.focus());
      }
    }}>
      <span>{actual}</span><GoogleIcon name={abierto ? "keyboard_arrow_up" : "keyboard_arrow_down"} />
    </button>
    {abierto && <div className={s.selectorPopup} role="listbox" aria-label={etiqueta}>{opciones.map((opcion, indice) => <button type="button" role="option" aria-selected={valor === opcion.valor} className={valor === opcion.valor ? s.opcionActiva : ""} key={opcion.valor} ref={(elemento) => { opcionesRef.current[indice] = elemento; }} onKeyDown={(evento) => {
      if (evento.key === "ArrowDown" || evento.key === "ArrowUp") {
        evento.preventDefault();
        const paso = evento.key === "ArrowDown" ? 1 : -1;
        opcionesRef.current[(indice + paso + opciones.length) % opciones.length]?.focus();
      }
      if (evento.key === "Home") { evento.preventDefault(); opcionesRef.current[0]?.focus(); }
      if (evento.key === "End") { evento.preventDefault(); opcionesRef.current[opciones.length - 1]?.focus(); }
    }} onClick={() => { alCambiar(opcion.valor); setAbierto(false); }}>{opcion.etiqueta}{valor === opcion.valor && <GoogleIcon name="check" />}</button>)}</div>}
  </div>;
}

export default function CalendarBrowser({ pruebas }: { pruebas: PruebaPublica[] }) {
  const [categoria, setCategoria] = useState("todas");
  const [estado, setEstado] = useState("todas");
  const visibles = pruebas.filter((prueba) =>
    (categoria === "todas" || prueba.categorias.includes(categoria as PruebaPublica["categorias"][number])) &&
    (estado === "todas" || (estado === "finalizadas" ? prueba.estado === "finalizada" : prueba.estado !== "finalizada"))
  );

  return <div className={s.browser}>
    <header className={s.browserCabecera}>
      <div><p className={s.eyebrowOscuro}>Fechas importantes de cada prueba</p><h2>Tres momentos para tener en cuenta</h2><p>Consulta cuándo se abren las inscripciones, cuándo se cierran y qué día se juega cada torneo.</p></div>
      <div className={s.filtros}><Selector etiqueta="Categoría" valor={categoria} opciones={OPCIONES_CATEGORIA} alCambiar={setCategoria} /><Selector etiqueta="Estado" valor={estado} opciones={OPCIONES_ESTADO} alCambiar={setEstado} /></div>
    </header>

    <p className={s.cuentaPruebas}><strong>{visibles.length}</strong> {visibles.length === 1 ? "prueba" : "pruebas"}</p>
    {visibles.length > 0 ? <ol className={s.listaPruebas}>
      {visibles.map((prueba) => {
        const apertura = fechaAperturaInscripciones(prueba.fechaInicio);
        const cierre = fechaCierreInscripciones(prueba.fechaInicio);
        const torneo = fechaDiaPrueba(prueba.fechaInicio);
        return <li key={prueba.id}>
          <Link href={`/pruebas/${prueba.slug}`} className={s.tarjetaPrueba}>
            <header className={s.tarjetaCabecera}><div><p className={s.tarjetaEyebrow}>{prueba.esMaster ? "Máster Final" : "Prueba del circuito"}</p><h3>{prueba.nombre}</h3></div><span className={s.estadoPrueba} data-estado={prueba.estado}>{ETIQUETAS_ESTADO_PRUEBA[prueba.estado]}</span></header>
            <div className={s.hitos}>
              <div className={`${s.hito} ${s.hitoApertura}`}><span className={s.hitoIcono}><GoogleIcon name="event_available" /></span><span className={s.hitoTexto}><span className={s.hitoEtiqueta}>Apertura de inscripciones</span><time dateTime={apertura}>{formatoFechaClave(apertura)}</time><small>Viernes, tres semanas antes</small></span></div>
              <div className={s.hito}>
                <span className={s.hitoIcono}><GoogleIcon name="event" /></span><span className={s.hitoTexto}><span className={s.hitoEtiqueta}>Cierre de inscripciones</span><time dateTime={cierre}>{formatoFechaClave(cierre)}</time><small>Dos días antes del torneo</small></span>
              </div>
              <div className={`${s.hito} ${s.hitoTorneo}`}><span className={s.hitoIcono}><GoogleIcon name="sports_tennis" /></span><span className={s.hitoTexto}><span className={s.hitoEtiqueta}>Día del torneo</span><time dateTime={torneo}>{formatoFechaClave(torneo)}</time><small>Una sola jornada</small></span></div>
            </div>
            <footer className={s.tarjetaPie}><span><GoogleIcon name="location_on" />{prueba.sede}</span><span>{prueba.categorias.map((categoriaPrueba) => ETIQUETAS_CATEGORIA[categoriaPrueba]).join(" · ")}</span><span className={s.verPrueba}>Ver detalles <GoogleIcon name="arrow_forward" /></span></footer>
          </Link>
        </li>;
      })}
    </ol> : <div className={s.sinPruebas}><GoogleIcon name="event" /><h3>No hay pruebas para estos filtros</h3><p>Prueba otra categoría o estado para consultar el calendario.</p><button type="button" onClick={() => { setCategoria("todas"); setEstado("todas"); }}>Mostrar todas las pruebas</button></div>}
  </div>;
}
