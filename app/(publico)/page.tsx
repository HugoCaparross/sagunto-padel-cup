import type { Metadata } from "next";
import { listarNoticias } from "@/actions/noticias";
import BarraInscripcionMovil from "@/components/home/BarraInscripcionMovil";
import ElCircuito from "@/components/home/ElCircuito";
import Hero from "@/components/home/Hero";
import LlamadaFinal from "@/components/home/LlamadaFinal";
import LineaCalendario from "@/components/home/LineaCalendario";
import PatrocinadoresHome from "@/components/home/PatrocinadoresHome";
import PremiosDestacados from "@/components/home/PremiosDestacados";
import ProximaPrueba from "@/components/home/ProximaPrueba";
import RankingTop5 from "@/components/home/RankingTop5";
import ResultadosRecientes from "@/components/home/ResultadosRecientes";
import UltimasNoticias from "@/components/home/UltimasNoticias";
import { cargarDatosHome } from "@/lib/home/datos";
import { patrocinadoresDePrueba, premiosDePrueba } from "@/lib/patrocinio/publico";
import { cargarPartidosPublicos } from "@/lib/pruebas/publico";

export const metadata: Metadata = { title: "Inicio" };

export default async function PaginaInicio() {
  const [datos, noticias] = await Promise.all([
    cargarDatosHome(),
    listarNoticias({ limite: 3 }),
  ]);

  const prueba = datos.proxima;
  const [patrocinadores, premios] = prueba
    ? await Promise.all([patrocinadoresDePrueba(prueba.id), premiosDePrueba(prueba.id)])
    : [[], []];

  const pruebasDeCircuito = datos.calendario.filter((p) => !p.esMaster).length;
  const pruebasFinalizadas = datos.calendario
    .filter((p) => p.estado === "finalizada")
    .sort((a, b) => b.fechaFin.localeCompare(a.fechaFin))
    .slice(0, 4);
  const resultados = (
    await Promise.all(
      pruebasFinalizadas.map(async (pruebaFinalizada) => ({
        prueba: pruebaFinalizada,
        partidos: await cargarPartidosPublicos(pruebaFinalizada.id),
      }))
    )
  )
    .flatMap(({ prueba: pruebaFinalizada, partidos }) =>
      partidos
        .filter((partido) => partido.resultado)
        .map((partido) => ({
          pruebaNombre: pruebaFinalizada.nombre,
          pruebaSlug: pruebaFinalizada.slug,
          partido,
        }))
    )
    .sort((a, b) => (b.partido.fecha ?? "").localeCompare(a.partido.fecha ?? ""))
    .slice(0, 4);

  return (
    <main className="pb-24 lg:pb-0" data-homepage="true">
      <Hero temporada={datos.temporada} proxima={prueba} pruebas={pruebasDeCircuito} />
      <ProximaPrueba prueba={prueba} />
      <ElCircuito />
      <LineaCalendario
        pruebas={datos.calendario}
        proximaId={prueba?.id ?? null}
        temporada={datos.temporada}
      />
      <RankingTop5 ranking={datos.ranking} />
      <PremiosDestacados premios={premios} />
      <ResultadosRecientes resultados={resultados} />
      <LlamadaFinal prueba={prueba} />
      <UltimasNoticias noticias={noticias} />
      <PatrocinadoresHome
        patrocinadores={patrocinadores}
        nombrePrueba={prueba?.nombre ?? null}
      />

      {prueba && (
        <BarraInscripcionMovil
          slug={prueba.slug}
          nombre={prueba.nombre}
          abierta={prueba.estado === "abierta"}
          plazasLibres={prueba.plazasLibres}
          plazasMaximas={prueba.plazasMaximas}
        />
      )}
    </main>
  );
}