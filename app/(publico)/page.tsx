import type { Metadata } from "next";
import { listarNoticias } from "@/actions/noticias";
import BarraInscripcionMovil from "@/components/home/BarraInscripcionMovil";
import ComoFunciona from "@/components/home/ComoFunciona";
import Hero from "@/components/home/Hero";
import LlamadaFinal from "@/components/home/LlamadaFinal";
import LineaCalendario from "@/components/home/LineaCalendario";
import PatrocinadoresHome from "@/components/home/PatrocinadoresHome";
import RankingTop5 from "@/components/home/RankingTop5";
import UltimasNoticias from "@/components/home/UltimasNoticias";
import { CATEGORIAS, type Categoria } from "@/lib/constantes";
import { cargarDatosHome, type FilaTop } from "@/lib/home/datos";
import {
  NOTICIAS_DEMO,
  PRUEBA_DEMO,
  PRUEBAS_DEMO,
  RANKING_DEMO,
  RANKING_GENERAL_DEMO,
} from "@/lib/home/datos-demo";
import { historicoPatrocinadores } from "@/lib/patrocinio/publico";

export const metadata: Metadata = { title: "Inicio" };

function combinarRankingGeneral(reales: FilaTop[], demostracion: FilaTop[]): FilaTop[] {
  return [...reales, ...demostracion]
    .sort((a, b) => b.puntos - a.puntos || b.victorias - a.victorias)
    .slice(0, 5)
    .map((fila, index) => ({ ...fila, posicion: index + 1 }));
}

export default async function PaginaInicio() {
  const [datos, noticias] = await Promise.all([
    cargarDatosHome(),
    listarNoticias({ limite: 3 }),
  ]);

  const usarDatosDemo = process.env.NODE_ENV === "development";
  const pruebaReal = datos.proxima;
  const prueba = usarDatosDemo ? PRUEBA_DEMO : pruebaReal;
  const historialPatrocinadoresVista = await historicoPatrocinadores();

  const calendario = usarDatosDemo
    ? [
        ...datos.calendario,
        ...PRUEBAS_DEMO.filter((demo) => !datos.calendario.some((real) => real.id === demo.id)).slice(
          0,
          Math.max(0, 6 - datos.calendario.length)
        ),
      ]
    : datos.calendario;
  const ranking = usarDatosDemo
    ? CATEGORIAS.reduce(
        (vista, categoria) => {
          const real = datos.ranking[categoria] ?? [];
          const muestras = RANKING_DEMO[categoria]
            .slice(real.length)
            .map((fila, index) => ({ ...fila, posicion: real.length + index + 1 }));
          vista[categoria] = [...real, ...muestras].slice(0, 5);
          return vista;
        },
        {} as Record<Categoria, (typeof RANKING_DEMO)[Categoria]>
      )
    : datos.ranking;
  const rankingGeneral = usarDatosDemo
      ? combinarRankingGeneral(datos.rankingGeneral, RANKING_GENERAL_DEMO)
      : datos.rankingGeneral;
  const noticiasVista = usarDatosDemo
    ? [...noticias, ...NOTICIAS_DEMO].slice(0, 3)
    : noticias;
  const pruebasDeCircuito = calendario.filter((p) => !p.esMaster).length;

  return (
    <main className="pb-24 lg:pb-0" data-homepage="true">
      <Hero
        temporada={datos.temporada}
        proxima={prueba}
        pruebas={pruebasDeCircuito}
        proximaHref={usarDatosDemo ? "/calendario" : undefined}
      />
      <ComoFunciona />
      <LineaCalendario
        pruebas={calendario}
        proximaId={prueba?.id ?? null}
        temporada={datos.temporada}
      />
      <RankingTop5 ranking={ranking} rankingGeneral={rankingGeneral} />
      <PatrocinadoresHome historial={historialPatrocinadoresVista} />
      <UltimasNoticias noticias={noticiasVista} />
      <LlamadaFinal />

      {pruebaReal && (
        <BarraInscripcionMovil
          slug={pruebaReal.slug}
          nombre={pruebaReal.nombre}
          abierta={pruebaReal.estado === "abierta"}
          plazasLibres={pruebaReal.plazasLibres}
          plazasMaximas={pruebaReal.plazasMaximas}
        />
      )}
    </main>
  );
}
