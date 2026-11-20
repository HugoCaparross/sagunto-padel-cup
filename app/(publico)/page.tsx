import type { Metadata } from "next";
import { listarNoticias } from "@/actions/noticias";
import ComoFunciona from "@/components/home/ComoFunciona";
import Hero from "@/components/home/Hero";
import LineaCalendario from "@/components/home/LineaCalendario";
import LlamadaFinal from "@/components/home/LlamadaFinal";
import PatrocinadoresHome from "@/components/home/PatrocinadoresHome";
import PremiosDestacados from "@/components/home/PremiosDestacados";
import ProximaPrueba from "@/components/home/ProximaPrueba";
import RankingTop5 from "@/components/home/RankingTop5";
import UltimasNoticias from "@/components/home/UltimasNoticias";
import { cargarDatosHome } from "@/lib/home/datos";
import { patrocinadoresDePrueba, premiosDePrueba } from "@/lib/patrocinio/publico";

export const metadata: Metadata = { title: "Inicio" };

export default async function PaginaInicio() {
  const [datos, noticias] = await Promise.all([
    cargarDatosHome(),
    listarNoticias({ limite: 3 }),
  ]);

  const prueba = datos.proxima;
  const patrocinadores = prueba ? await patrocinadoresDePrueba(prueba.id) : [];
  const premios = prueba ? await premiosDePrueba(prueba.id) : [];

  return (
    <>
      <Hero temporada={datos.temporada} />

      <div className="container space-y-20 py-16">
        <ProximaPrueba prueba={prueba} />
        <ComoFunciona />
        <LineaCalendario pruebas={datos.calendario} proximaId={prueba?.id ?? null} />
        <RankingTop5 ranking={datos.ranking} />
        <PremiosDestacados premios={premios} />
        {prueba && (
          <PatrocinadoresHome patrocinadores={patrocinadores} nombrePrueba={prueba.nombre} />
        )}
        <UltimasNoticias noticias={noticias} />
      </div>

      <LlamadaFinal />
    </>
  );
}