import { enviarCorreo } from "@/lib/email/cliente";
import {
    inscripcionCancelada,
    inscripcionConfirmada,
    inscripcionRegistrada,
    plazaLiberada,
    renderHtml,
    renderTexto,
    type DatosAviso,
} from "@/lib/email/plantillas";
import { ETIQUETAS_CATEGORIA, type Categoria } from "@/lib/constantes";
import { crearClienteAdmin } from "@/lib/supabase/server";

export type TipoAviso = "registrada" | "confirmada" | "promocion" | "baja";

type InscripcionAviso = {
    id: string;
    categoria: Categoria;
    estado: string;
    jugador_1: string;
    jugador_2: string | null;
    prueba: {
        nombre: string;
        fecha_inicio: string;
        precio_pareja_centimos: number;
    } | null;
};

// Email y nombre de un jugador. Nombre y email vienen de perfiles y de Supabase Auth.
async function datosDeJugador(id: string): Promise<{ email: string; nombre: string } | null> {
    const admin = crearClienteAdmin();
    const [{ data: perfil }, usuario] = await Promise.all([
        admin.from("perfiles").select("nombre").eq("id", id).maybeSingle<{ nombre: string }>(),
        admin.auth.admin.getUserById(id),
    ]);

    const email = usuario?.data?.user?.email;
    if (!email) return null;
    return { email, nombre: perfil?.nombre || "jugador" };
}

// Avisa a los dos jugadores de una inscripción. Nunca lanza.
export async function notificarInscripcion(inscripcionId: string, tipo: TipoAviso): Promise<void> {
    try {
        const admin = crearClienteAdmin();
        const { data, error } = await admin
            .from("inscripciones")
            .select(
                "id, categoria, estado, jugador_1, jugador_2, prueba:pruebas(nombre, fecha_inicio, precio_pareja_centimos)"
            )
            .eq("id", inscripcionId)
            .maybeSingle();
        if (error || !data) return;

        const insc = data as unknown as InscripcionAviso;
        if (!insc.prueba) return;

        const base: DatosAviso = {
            nombre: "",
            prueba: insc.prueba.nombre,
            categoria: ETIQUETAS_CATEGORIA[insc.categoria],
            fechaInicio: insc.prueba.fecha_inicio,
            precioCentimos: insc.prueba.precio_pareja_centimos,
        };

        const ids = [insc.jugador_1, insc.jugador_2].filter((x): x is string => Boolean(x));

        for (const id of ids) {
            const jugador = await datosDeJugador(id);
            if (!jugador) continue;

            const datos = { ...base, nombre: jugador.nombre };
            const contenido =
                tipo === "registrada"
                    ? inscripcionRegistrada({ ...datos, enListaEspera: insc.estado === "lista_espera" })
                    : tipo === "confirmada"
                        ? inscripcionConfirmada(datos)
                        : tipo === "promocion"
                            ? plazaLiberada(datos)
                            : inscripcionCancelada(datos);

            await enviarCorreo({
                para: jugador.email,
                asunto: contenido.asunto,
                html: renderHtml(contenido),
                texto: renderTexto(contenido),
            });
        }
    } catch (e) {
        console.error(`[email] notificarInscripcion (${tipo}):`, e);
    }
}