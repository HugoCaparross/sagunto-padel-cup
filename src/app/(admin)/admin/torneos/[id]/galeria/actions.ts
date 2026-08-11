// Ruta: src/app/(admin)/admin/torneos/[id]/galeria/actions.ts
"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

const uuidSchema = z.string().uuid();

const collaboratorSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, {
      message: "Introduce el nombre del colaborador",
    })
    .max(120, {
      message: "El nombre es demasiado largo",
    }),
  diasValidez: z
    .number()
    .int()
    .min(1, {
      message: "La validez mínima es de 1 día",
    })
    .max(90, {
      message: "La validez máxima es de 90 días",
    }),
});

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function revalidateGallery(
  torneoId: string
) {
  revalidatePath(
    `/admin/torneos/${torneoId}/galeria`
  );
}

async function comprobarTorneo(
  torneoId: string
) {
  const admin = createAdminClient();

  return admin
    .from("tournaments")
    .select("id, slug")
    .eq("id", torneoId)
    .maybeSingle();
}

async function validarImagen(
  file: File
) {
  if (!ALLOWED_TYPES.has(file.type)) {
    return {
      ok: false as const,
      error:
        "Formato no permitido. Utiliza JPG, PNG o WebP.",
    };
  }

  if (file.size <= 0) {
    return {
      ok: false as const,
      error: "La imagen está vacía.",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      ok: false as const,
      error:
        "La imagen supera el límite de 10 MB.",
    };
  }

  const buffer = new Uint8Array(
    await file.arrayBuffer()
  );

  const esJpeg =
    file.type === "image/jpeg" &&
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff;

  const esPng =
    file.type === "image/png" &&
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;

  const esWebp =
    file.type === "image/webp" &&
    buffer.length >= 12 &&
    String.fromCharCode(
      buffer[0],
      buffer[1],
      buffer[2],
      buffer[3]
    ) === "RIFF" &&
    String.fromCharCode(
      buffer[8],
      buffer[9],
      buffer[10],
      buffer[11]
    ) === "WEBP";

  if (!esJpeg && !esPng && !esWebp) {
    return {
      ok: false as const,
      error:
        "El contenido del archivo no coincide con una imagen válida.",
    };
  }

  return {
    ok: true as const,
  };
}

export async function subirFoto(
  torneoId: string,
  formData: FormData
) {
  await requireAdmin();

  const parsedTournamentId =
    uuidSchema.safeParse(torneoId);

  if (!parsedTournamentId.success) {
    return {
      ok: false,
      error: "Identificador de torneo no válido",
    };
  }

  const { data: torneo, error: torneoError } =
    await comprobarTorneo(parsedTournamentId.data);

  if (torneoError) {
    console.error(
      "[admin/galeria] Error comprobando torneo:",
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

  const file = formData.get("foto");

  if (!(file instanceof File)) {
    return {
      ok: false,
      error: "Selecciona una fotografía",
    };
  }

  const validacion =
    await validarImagen(file);

  if (!validacion.ok) {
    return validacion;
  }

  const extension =
    EXTENSIONS[file.type] ?? "jpg";

  const path =
    `${parsedTournamentId.data}/${crypto.randomUUID()}.${extension}`;

  const admin = createAdminClient();

  const { error: uploadError } =
    await admin.storage
      .from("galeria")
      .upload(path, file, {
        contentType: file.type,
        cacheControl: "31536000",
        upsert: false,
      });

  if (uploadError) {
    console.error(
      "[admin/galeria] Error subiendo fotografía:",
      uploadError
    );

    return {
      ok: false,
      error:
        "No se ha podido subir la fotografía",
    };
  }

  const { data: urlData } = admin.storage
    .from("galeria")
    .getPublicUrl(path);

  const { error: insertError } =
    await admin
      .from("gallery_items")
      .insert({
        tournament_id:
          parsedTournamentId.data,
        url: urlData.publicUrl,
        tipo: "foto",
        subido_por: "admin",
      });

  if (insertError) {
    console.error(
      "[admin/galeria] Error registrando fotografía:",
      insertError
    );

    await admin.storage
      .from("galeria")
      .remove([path]);

    return {
      ok: false,
      error:
        "La fotografía se ha subido pero no se ha podido registrar correctamente",
    };
  }

  revalidateGallery(
    parsedTournamentId.data
  );

  if (torneo.slug) {
    revalidatePath(
      `/torneo/${torneo.slug}/fotos`
    );
  }

  return {
    ok: true,
  };
}

export async function borrarFoto(
  torneoId: string,
  itemId: string
) {
  await requireAdmin();

  const parsedTournamentId =
    uuidSchema.safeParse(torneoId);

  const parsedItemId =
    uuidSchema.safeParse(itemId);

  if (!parsedTournamentId.success) {
    return {
      ok: false,
      error: "Identificador de torneo no válido",
    };
  }

  if (!parsedItemId.success) {
    return {
      ok: false,
      error: "Identificador de fotografía no válido",
    };
  }

  const admin = createAdminClient();

  const { data: foto, error: fotoError } =
    await admin
      .from("gallery_items")
      .select("id, url")
      .eq("id", parsedItemId.data)
      .eq(
        "tournament_id",
        parsedTournamentId.data
      )
      .maybeSingle();

  if (fotoError) {
    console.error(
      "[admin/galeria] Error comprobando fotografía:",
      fotoError
    );

    return {
      ok: false,
      error:
        "No se ha podido comprobar la fotografía",
    };
  }

  if (!foto) {
    return {
      ok: false,
      error:
        "La fotografía no existe o no pertenece a este torneo",
    };
  }

  const { error: deleteError } =
    await admin
      .from("gallery_items")
      .delete()
      .eq("id", parsedItemId.data)
      .eq(
        "tournament_id",
        parsedTournamentId.data
      );

  if (deleteError) {
    console.error(
      "[admin/galeria] Error eliminando fotografía:",
      deleteError
    );

    return {
      ok: false,
      error:
        "No se ha podido eliminar la fotografía",
    };
  }

  revalidateGallery(
    parsedTournamentId.data
  );

  return {
    ok: true,
  };
}

export async function crearAccesoColaborador(
  torneoId: string,
  nombreColaborador: string,
  diasValidez: number
) {
  await requireAdmin();

  const parsedTournamentId =
    uuidSchema.safeParse(torneoId);

  if (!parsedTournamentId.success) {
    return {
      ok: false,
      error: "Identificador de torneo no válido",
    };
  }

  const parsed =
    collaboratorSchema.safeParse({
      nombre: nombreColaborador,
      diasValidez,
    });

  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Los datos del colaborador no son válidos",
    };
  }

  const { data: torneo, error: torneoError } =
    await comprobarTorneo(parsedTournamentId.data);

  if (torneoError) {
    console.error(
      "[admin/galeria] Error comprobando torneo:",
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

  const fechaExpiracion = new Date();

  fechaExpiracion.setDate(
    fechaExpiracion.getDate() +
      parsed.data.diasValidez
  );

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("gallery_upload_access")
    .insert({
      tournament_id:
        parsedTournamentId.data,
      nombre_colaborador:
        parsed.data.nombre,
      fecha_expiracion:
        fechaExpiracion.toISOString(),
    })
    .select("token_acceso")
    .single();

  if (error || !data) {
    console.error(
      "[admin/galeria] Error creando acceso:",
      error
    );

    return {
      ok: false,
      error:
        "No se ha podido crear el acceso de colaborador",
    };
  }

  revalidateGallery(
    parsedTournamentId.data
  );

  return {
    ok: true,
    token: data.token_acceso,
  };
}