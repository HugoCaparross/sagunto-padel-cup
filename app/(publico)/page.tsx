import type { Metadata } from "next";
import { listarNoticias } from "@/actions/noticias";
import ComoFunciona from "@/components/home/ComoFunciona";
import Hero from "@/components/home/Hero";
import LineaCalendario from "@/components/home/LineaCalendario";
import LlamadaFinal from "@/components/home/LlamadaFinal";
import ProximaPrueba from "@/components/home/ProximaPrueba";
import RankingTop5 from "@/components/home/RankingTop5";
import UltimasNoticias from "@/components/home/UltimasNoticias";
import { cargarDatosHome } from "@/lib/home/datos";

export const metadata: Metadata = { title: "Inicio" };

export default async function PaginaInicio() {
  const [datos, noticias] = await Promise.all([
    cargarDatosHome(),
    listarNoticias({ limite: 3 }),
  ]);

  return (
    <>
      <Hero temporada={datos.temporada} />

      <div className="container space-y-20 py-16">
        <ProximaPrueba prueba={datos.proxima} />
        <ComoFunciona />
        <LineaCalendario pruebas={datos.calendario} proximaId={datos.proxima?.id ?? null} />
        <RankingTop5 ranking={datos.ranking} />
        <UltimasNoticias noticias={noticias} />
      </div>

      <LlamadaFinal />
    </>
  );
}