import type { Metadata } from "next";
import Link from "next/link";
import CabeceraPagina from "@/components/ui/CabeceraPagina";
import LlamadaFinal from "@/components/ui/LlamadaFinal";
import Seccion from "@/components/ui/Seccion";
import Boton from "@/components/ui/Boton";
import { listarPruebasPublicas } from "@/lib/pruebas/publico";
import CalendarBrowser from "./CalendarBrowser";

export const metadata: Metadata = { title: "Calendario" };

export default async function PaginaCalendario() {
  const pruebas = await listarPruebasPublicas();

  return <main>
    <CabeceraPagina eyebrow="Calendario · Temporada 2026–2027" titulo="Pruebas de la temporada" descripcion="Consulta las fechas de inscripción y los días de cada prueba." acciones={<Boton asChild><Link href="#calendario">Ver próximas pruebas</Link></Boton>} />
    <Seccion id="calendario" variante="clara"><CalendarBrowser pruebas={pruebas} /></Seccion>
    <LlamadaFinal titulo="Tu temporada empieza aquí." texto="Descubre cómo funciona el formato y prepárate para saltar a la pista." cta={<Link href="/circuito" className="btn btn-primario">Conoce el circuito</Link>} />
  </main>;
}
