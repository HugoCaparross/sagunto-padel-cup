// Ruta: src/app/(admin)/admin/torneos/[id]/patrocinadores/actions.ts
"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

const uuidSchema = z.string().uuid();

const sponsorSchema = z.object({
  torneoId: uuidSchema,
  nombre: z
    .string()
    .trim()
    .min(2, {
      message: "El nombre del patrocinador es obligatorio",
    })
    .max(160, {
      message:
        "El nombre del patrocinador es demasiado largo",
    }),
  logo_url: z
    .string()
    .trim()
    .max(1000, {
      message: "La URL del logo es demasiado larga",
    })
    .refine(
      (value) => {
        if (!value) {
          return true;
        }

        try {
          const url = new URL(value);

          return (
            url.protocol === "https:" ||
            url.protocol === "http:"
          );
        } catch {
          return false;
        }
      },
      {
        message:
          "La URL del logo no es válida",
      }
    ),
  descripcion: z
    .string()
    .trim()
    .max(1000, {
      message:
        "La descripción es demasiado larga",
    }),
  enlace: z
    .string()
    .trim()
    .max(1000, {
      message:
        "El enlace del patrocinador es demasiado largo",
    })
    .refine(
      (value) => {
        if (!value) {
          return true;
        }

        try {
          const url = new URL(value);

          return (
            url.protocol === "https:" ||
            url.protocol === "http:"
          );
        } catch {
          return false;
        }
      },
      {
        message:
          "El enlace del patrocinador no es válido",
      }
    ),
  tipo: z.enum([
    "comercial",
    "institucion",
  ]),
});

export async function crearSponsor(
  torneoId: string,
  data: {
    nombre: string;
    logo_url: string;
    descripcion: string;
    enlace: string;
    tipo:
      | "comercial"
      | "institucion";
  }
) {
  await requireAdmin();

  const parsed = sponsorSchema.safeParse({
    torneoId,
    ...data,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Los datos del patrocinador no son válidos",
    };
  }

  const admin = createAdminClient();

  const { data: torneo, error: torneoError } =
    await admin
      .from("tournaments")
      .select("id")
      .eq("id", parsed.data.torneoId)
      .maybeSingle();

  if (torneoError) {
    console.error(
      "[admin/patrocinadores] Error comprobando torneo:",
      torneoError
    );

    return {
      ok: false,
      error:
        "No se ha podido comprobar el torneo",
    };
  }

  if (!torneo) {
    return {
      ok: false,
      error: "El torneo no existe",
    };
  }

  const { error } = await admin
    .from("sponsors")
    .insert({
      tournament_id:
        parsed.data.torneoId,
      nombre: parsed.data.nombre,
      logo_url:
        parsed.data.logo_url || null,
      descripcion:
        parsed.data.descripcion || null,
      enlace:
        parsed.data.enlace || null,
      tipo: parsed.data.tipo,
      orden: 0,
    });

  if (error) {
    console.error(
      "[admin/patrocinadores] Error creando patrocinador:",
      error
    );

    return {
      ok: false,
      error:
        "No se ha podido crear el patrocinador",
    };
  }

  revalidatePath(
    `/admin/torneos/${parsed.data.torneoId}/patrocinadores`
  );

  return {
    ok: true,
  };
}

export async function borrarSponsor(
  torneoId: string,
  sponsorId: string
) {
  await requireAdmin();

  const parsedTournamentId =
    uuidSchema.safeParse(torneoId);

  const parsedSponsorId =
    uuidSchema.safeParse(sponsorId);

  if (!parsedTournamentId.success) {
    return {
      ok: false,
      error:
        "Identificador de torneo no válido",
    };
  }

  if (!parsedSponsorId.success) {
    return {
      ok: false,
      error:
        "Identificador de patrocinador no válido",
    };
  }

  const admin = createAdminClient();

  const { data: sponsor, error: sponsorError } =
    await admin
      .from("sponsors")
      .select("id, tournament_id")
      .eq("id", parsedSponsorId.data)
      .eq(
        "tournament_id",
        parsedTournamentId.data
      )
      .maybeSingle();

  if (sponsorError) {
    console.error(
      "[admin/patrocinadores] Error comprobando patrocinador:",
      sponsorError
    );

    return {
      ok: false,
      error:
        "No se ha podido comprobar el patrocinador",
    };
  }

  if (!sponsor) {
    return {
      ok: false,
      error:
        "El patrocinador no existe o no pertenece a este torneo",
    };
  }

  const { error: deleteError } =
    await admin
      .from("sponsors")
      .delete()
      .eq("id", parsedSponsorId.data)
      .eq(
        "tournament_id",
        parsedTournamentId.data
      );

  if (deleteError) {
    console.error(
      "[admin/patrocinadores] Error eliminando patrocinador:",
      deleteError
    );

    return {
      ok: false,
      error:
        "No se ha podido eliminar el patrocinador",
    };
  }

  revalidatePath(
    `/admin/torneos/${parsedTournamentId.data}/patrocinadores`
  );

  return {
    ok: true,
  };
}