// Ruta: src/app/(admin)/admin/torneos/[id]/cuadros/actions.ts
"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { nextPow2, FASE_POR_NUM_PARTIDOS, buildFirstRound } from "@/lib/bracket";
import { advanceWinner } from "@/lib/advance";
import { ordenarClasificacionGrupo } from "@/lib/grupos";
import { revalidatePath } from "next/cache";

const uuidSchema = z.string().uuid();

const tramoSchema = z.enum(["oro", "plata", "bronce"]);

type Tramo = z.infer<typeof tramoSchema>;

type StandingRow = {
  pair_id: string;
  puntos: number;
  sets_favor: number;
  sets_contra: number;
  juegos_favor: number;
  juegos_contra: number;
};

type PartidoGrupo = {
  pair_1_id: string | null;
  pair_2_id: string | null;
  resultado_json: { ganador_id?: string } | null;
};

type BracketStructure = {
  num_parejas: number;
  fase_inicial: string;
  byes: string[];
  enfrentamientos: [string, string][];
};

async function obtenerTorneo(
  torneoId: string
) {
  const admin = createAdminClient();

  return admin
    .from("tournaments")
    .select("id, slug, estado")
    .eq("id", torneoId)
    .maybeSingle();
}

export async function generarFaseFinal(
  torneoId: string,
  categoriaId: string
) {
  await requireAdmin();

  const parsedTournamentId = uuidSchema.safeParse(torneoId);
  const parsedCategoriaId = uuidSchema.safeParse(categoriaId);

  if (!parsedTournamentId.success) {
    return {
      ok: false,
      error: "Identificador de torneo no válido",
    };
  }

  if (!parsedCategoriaId.success) {
    return {
      ok: false,
      error: "Identificador de categoría no válido",
    };
  }

  const admin = createAdminClient();

  const { data: torneo, error: torneoError } =
    await obtenerTorneo(parsedTournamentId.data);

  if (torneoError) {
    console.error(
      "[admin/cuadros] Error comprobando torneo:",
      torneoError
    );

    return {
      ok: false,
      error: "No se ha podido comprobar el torneo",
    };
  }

  if (!torneo) {
    return {
      ok: false,
      error: "El torneo no existe",
    };
  }

  if (
    torneo.estado === "en_juego" ||
    torneo.estado === "finalizado" ||
    torneo.estado === "archivado"
  ) {
    return {
      ok: false,
      error:
        "No se pueden regenerar los cuadros cuando la competición ya está en curso o cerrada",
    };
  }

  const { data: categoria, error: categoriaError } = await admin
    .from("categories")
    .select("id, nombre")
    .eq("id", parsedCategoriaId.data)
    .maybeSingle();

  if (categoriaError) {
    console.error(
      "[admin/cuadros] Error comprobando categoría:",
      categoriaError
    );

    return {
      ok: false,
      error: "No se ha podido comprobar la categoría",
    };
  }

  if (!categoria) {
    return {
      ok: false,
      error: "La categoría no existe",
    };
  }

  const { data: grupos, error: gruposError } = await admin
    .from("groups")
    .select("id")
    .eq("tournament_id", parsedTournamentId.data)
    .eq("categoria_id", parsedCategoriaId.data)
    .order("id");

  if (gruposError) {
    console.error(
      "[admin/cuadros] Error cargando grupos:",
      gruposError
    );

    return {
      ok: false,
      error: "No se han podido cargar los grupos",
    };
  }

  if (!grupos?.length) {
    return {
      ok: false,
      error:
        "No hay grupos generados para esta categoría",
    };
  }

  const { data: bracketsExistentes, error: bracketsError } =
    await admin
      .from("brackets")
      .select("id, tramo")
      .eq("tournament_id", parsedTournamentId.data)
      .eq("categoria_id", parsedCategoriaId.data);

  if (bracketsError) {
    console.error(
      "[admin/cuadros] Error comprobando cuadros existentes:",
      bracketsError
    );

    return {
      ok: false,
      error: "No se ha podido comprobar el estado actual de los cuadros",
    };
  }

  if (bracketsExistentes?.length) {
    return {
      ok: false,
      error:
        "Ya existe un cuadro para esta categoría. No se puede regenerar encima del cuadro actual.",
    };
  }

  const tramosAsignados: {
    pairId: string;
    tramo: Tramo;
    posicionGlobal: number;
  }[] = [];

  for (const grupo of grupos) {
    const { data: todosPartidos, error: partidosError } =
      await admin
        .from("matches")
        .select(
          "id, pair_1_id, pair_2_id, estado, resultado_json"
        )
        .eq("group_id", grupo.id);

    if (partidosError) {
      console.error(
        "[admin/cuadros] Error cargando partidos del grupo:",
        partidosError
      );

      return {
        ok: false,
        error:
          "No se han podido comprobar los resultados de los grupos",
      };
    }

    if (!todosPartidos?.length) {
      return {
        ok: false,
        error:
          "No todos los grupos tienen partidos generados",
      };
    }

    const pendientes = todosPartidos.filter(
      (partido) => partido.estado !== "finalizado"
    );

    if (pendientes.length > 0) {
      return {
        ok: false,
        error:
          "Todos los partidos de la fase de grupos deben estar finalizados antes de generar los cuadros",
      };
    }

    const { data: standings, error: standingsError } =
      await admin
        .from("group_standings")
        .select(
          "pair_id, puntos, sets_favor, sets_contra, juegos_favor, juegos_contra"
        )
        .eq("group_id", grupo.id);

    if (standingsError) {
      console.error(
        "[admin/cuadros] Error cargando clasificación:",
        standingsError
      );

      return {
        ok: false,
        error:
          "No se ha podido cargar la clasificación de los grupos",
      };
    }

    if (!standings?.length) {
      return {
        ok: false,
        error:
          "No existe clasificación para alguno de los grupos",
      };
    }

    const partidosGrupo: PartidoGrupo[] = todosPartidos.map(
      (partido) => ({
        pair_1_id: partido.pair_1_id,
        pair_2_id: partido.pair_2_id,
        resultado_json: partido.resultado_json,
      })
    );

    const orden = ordenarClasificacionGrupo(
      standings as StandingRow[],
      partidosGrupo
    );

    const tamano = orden.length;

    orden.forEach((standing, index) => {
      let tramo: Tramo;

      if (tamano >= 4) {
        tramo =
          index < 2
            ? "oro"
            : index === 2
              ? "plata"
              : "bronce";
      } else {
        tramo =
          index === 0
            ? "oro"
            : index === 1
              ? "plata"
              : "bronce";
      }

      tramosAsignados.push({
        pairId: standing.pair_id,
        tramo,
        posicionGlobal: index,
      });
    });
  }

  const tramos: Tramo[] = ["oro", "plata", "bronce"];

  for (const tramo of tramos) {
    const parejas = tramosAsignados
      .filter((item) => item.tramo === tramo)
      .sort((a, b) => {
        if (a.posicionGlobal !== b.posicionGlobal) {
          return a.posicionGlobal - b.posicionGlobal;
        }

        return a.pairId.localeCompare(b.pairId);
      })
      .map((item) => item.pairId);

    if (parejas.length < 2) {
      continue;
    }

    const firstRound = buildFirstRound(parejas);
    const estructura: BracketStructure = {
      num_parejas: parejas.length,
      fase_inicial: firstRound.fase,
      byes: firstRound.byes,
      enfrentamientos: firstRound.enfrentamientos,
    };

    const { data: bracket, error: bracketError } =
      await admin
        .from("brackets")
        .insert({
          tournament_id: parsedTournamentId.data,
          categoria_id: parsedCategoriaId.data,
          tramo,
          estructura_json: estructura,
        })
        .select("id")
        .single();

    if (bracketError || !bracket) {
      console.error(
        "[admin/cuadros] Error creando bracket:",
        bracketError
      );

      return {
        ok: false,
        error:
          "No se ha podido crear la estructura del cuadro",
      };
    }

    const totalSlots = nextPow2(parejas.length);
    const numRondas = Math.log2(totalSlots);

    let rondaActual: string[] = [];

    const { data: final, error: finalError } =
      await admin
        .from("matches")
        .insert({
          tournament_id: parsedTournamentId.data,
          categoria_id: parsedCategoriaId.data,
          fase: "final",
          tramo,
          estado: "pendiente",
        })
        .select("id")
        .single();

    if (finalError || !final) {
      console.error(
        "[admin/cuadros] Error creando final:",
        finalError
      );

      await admin
        .from("brackets")
        .delete()
        .eq("id", bracket.id);

      return {
        ok: false,
        error: "No se ha podido crear la fase final",
      };
    }

    rondaActual = [final.id];

    for (let r = numRondas - 1; r >= 1; r -= 1) {
      const numPartidos = totalSlots / 2 ** r;
      const nuevaRonda: string[] = [];

      for (let i = 0; i < numPartidos; i += 1) {
        const siguienteMatchId =
          rondaActual[Math.floor(i / 2)];

        const siguienteSlot =
          i % 2 === 0 ? 1 : 2;

        const { data: match, error: matchError } =
          await admin
            .from("matches")
            .insert({
              tournament_id: parsedTournamentId.data,
              categoria_id: parsedCategoriaId.data,
              fase:
                FASE_POR_NUM_PARTIDOS[numPartidos] ??
                "octavos",
              tramo,
              estado: "pendiente",
              siguiente_match_id: siguienteMatchId,
              siguiente_slot: siguienteSlot,
            })
            .select("id")
            .single();

        if (matchError || !match) {
          console.error(
            "[admin/cuadros] Error creando partido:",
            matchError
          );

          return {
            ok: false,
            error:
              "No se ha podido completar la estructura del cuadro",
          };
        }

        nuevaRonda.push(match.id);
      }

      rondaActual = nuevaRonda;
    }

    const numByes = totalSlots - parejas.length;
    const byes = parejas.slice(0, numByes);
    const resto = parejas.slice(numByes);

    for (let i = 0; i < byes.length; i += 1) {
      const matchId = rondaActual[i];

      if (!matchId) {
        return {
          ok: false,
          error:
            "La estructura del cuadro no permite asignar correctamente los byes",
        };
      }

      const { error: byeError } = await admin
        .from("matches")
        .update({
          pair_1_id: byes[i],
          estado: "finalizado",
          resultado_json: {
            bye: true,
            ganador_id: byes[i],
          },
        })
        .eq("id", matchId);

      if (byeError) {
        console.error(
          "[admin/cuadros] Error asignando bye:",
          byeError
        );

        return {
          ok: false,
          error:
            "No se ha podido asignar correctamente un bye",
        };
      }

      await advanceWinner(
        admin,
        matchId,
        byes[i]
      );
    }

    for (
      let i = 0;
      i < resto.length / 2;
      i += 1
    ) {
      const matchId =
        rondaActual[byes.length + i];

      if (!matchId) {
        return {
          ok: false,
          error:
            "La estructura del cuadro no permite asignar correctamente los enfrentamientos",
        };
      }

      const { error: pairingError } =
        await admin
          .from("matches")
          .update({
            pair_1_id: resto[i],
            pair_2_id:
              resto[resto.length - 1 - i],
          })
          .eq("id", matchId);

      if (pairingError) {
        console.error(
          "[admin/cuadros] Error asignando enfrentamiento:",
          pairingError
        );

        return {
          ok: false,
          error:
            "No se han podido asignar los enfrentamientos del cuadro",
        };
      }
    }
  }

  revalidatePath(
    `/admin/torneos/${parsedTournamentId.data}/cuadros`
  );
  revalidatePath(
    `/admin/torneos/${parsedTournamentId.data}`
  );

  if (torneo.slug) {
    revalidatePath(`/torneo/${torneo.slug}/cuadros`);
  }

  return {
    ok: true,
  };
}