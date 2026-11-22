import type { Metadata } from "next";
import { listarNoticias } from "@/actions/noticias";
import BarraInscripcionMovil from "@/components/home/BarraInscripcionMovil";
import ComoFunciona from "@/components/home/ComoFunciona";
import ElCircuito from "@/components/home/ElCircuito";
import Hero from "@/components/home/Hero";
import LlamadaFinal from "@/components/home/LlamadaFinal";
import LineaCalendario from "@/components/home/LineaCalendario";
import PatrocinadoresHome from "@/components/home/PatrocinadoresHome";
import PremiosDestacados from "@/components/home/PremiosDestacados";
import RankingTop5 from "@/components/home/RankingTop5";
import ResultadosRecientes from "@/components/home/ResultadosRecientes";
import UltimasNoticias from "@/components/home/UltimasNoticias";
import { CATEGORIAS, type Categoria } from "@/lib/constantes";
import { cargarDatosHome } from "@/lib/home/datos";
import {
  NOTICIAS_DEMO,
  PATROCINADORES_DEMO,
  PREMIOS_DEMO,
  PRUEBA_DEMO,
  PRUEBAS_DEMO,
  RANKING_DEMO,
  RESULTADOS_DEMO,
} from "@/lib/home/datos-demo";
import { patrocinadoresDePrueba, premiosDePrueba } from "@/lib/patrocinio/publico";
import { cargarPartidosPublicos } from "@/lib/pruebas/publico";

export const metadata: Metadata = { title: "Inicio" };

export default async function PaginaInicio() {
  const [datos, noticias] = await Promise.all([
    cargarDatosHome(),
    listarNoticias({ limite: 3 }),
  ]);

  const usarDatosDemo = process.env.NODE_ENV === "development";
  const pruebaReal = datos.proxima;
  const prueba = usarDatosDemo ? PRUEBA_DEMO : pruebaReal;
  const [patrocinadores, premios] = pruebaReal
    ? await Promise.all([patrocinadoresDePrueba(pruebaReal.id), premiosDePrueba(pruebaReal.id)])
    : [[], []];

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
  const premiosVista = usarDatosDemo
    ? [
        ...premios,
        ...PREMIOS_DEMO.filter(
          (demo) => !premios.some((real) => real.categoria === demo.categoria)
        ),
      ]
    : premios;
  const patrocinadoresVista = usarDatosDemo
    ? [
        ...patrocinadores,
        ...PATROCINADORES_DEMO.filter(
          (demo) => !patrocinadores.some((real) => real.nombre === demo.nombre)
        ).slice(0, Math.max(0, 4 - patrocinadores.length)),
      ]
    : patrocinadores;
  const noticiasVista = usarDatosDemo
    ? [...noticias, ...NOTICIAS_DEMO].slice(0, 3)
    : noticias;
  const pruebasDeCircuito = calendario.filter((p) => !p.esMaster).length;
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
  const resultadosVista = usarDatosDemo
    ? [...resultados, ...RESULTADOS_DEMO].slice(0, 4)
    : resultados;

  return (
    <main className="pb-24 lg:pb-0" data-homepage="true">
      <Hero
        temporada={datos.temporada}
        proxima={prueba}
        pruebas={pruebasDeCircuito}
        proximaHref={usarDatosDemo ? "/calendario" : undefined}
      />
      <ElCircuito />
      <ComoFunciona />
      <LineaCalendario
        pruebas={calendario}
        proximaId={prueba?.id ?? null}
        temporada={datos.temporada}
      />
      <RankingTop5 ranking={ranking} />
      <PremiosDestacados premios={premiosVista} />
      <ResultadosRecientes resultados={resultadosVista} />
      <PatrocinadoresHome
        patrocinadores={patrocinadoresVista}
        nombrePrueba={prueba?.nombre ?? null}
      />
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