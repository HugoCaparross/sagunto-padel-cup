// Documentos legales de la web.
// Adaptado a: web informativa, sin pagos ni cobros online, inscripción registrada y confirmada
// por el organizador, pago en persona el día de la prueba, datos alojados en Supabase (Frankfurt, UE),
// titular persona física sin actividad económica.
//
// Si la web genera ingresos (patrocinios remunerados, cobros), revisar aviso legal y condiciones.

export const TIPOS_DOCUMENTO = [
    "aviso_legal",
    "privacidad",
    "cookies",
    "condiciones_inscripcion",
    "reglamento",
] as const;

export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number];

export type Requisito = {
    tipo: TipoDocumento;
    nombre: string;
    baseLegal: string;
    contenidoMinimo: string[];
    // Palabras que el texto publicado debe contener. Si falta alguna, el panel avisa.
    palabrasClave: string[];
    ruta: string;
};

export const REQUISITOS: Requisito[] = [
    {
        tipo: "aviso_legal",
        nombre: "Aviso legal",
        baseLegal: "Ley 34/2002 (LSSI-CE), art. 10, aplicable si hay contraprestación económica",
        contenidoMinimo: [
            "Nombre del responsable del circuito",
            "Email de contacto dedicado",
            "Objeto de la web: información del circuito, ranking, calendario y noticias",
            "Aclaración de que la web no gestiona pagos ni cobros",
            "Propiedad intelectual de contenidos y logotipo",
            "Legislación aplicable y jurisdicción",
        ],
        palabrasClave: ["@", "propiedad intelectual"],
        ruta: "/aviso-legal",
    },
    {
        tipo: "privacidad",
        nombre: "Política de privacidad",
        baseLegal: "RGPD arts. 13-14; LOPDGDD",
        contenidoMinimo: [
            "Responsable del tratamiento: nombre y email de contacto para ejercer derechos",
            "Datos tratados: nombre, email, talla de camiseta, datos deportivos (opcionales), inscripciones, resultados y mensajes de contacto",
            "Finalidades y base legal: contrato o solicitud del interesado (inscripciones, resultados, ranking), consentimiento (imagen, visibilidad pública, datos deportivos, mayoría de edad o autorización del tutor), interés legítimo (seguridad y auditoría)",
            "Encargado del tratamiento: Supabase, con alojamiento en Frankfurt (Unión Europea), sin transferencias fuera de la UE",
            "Los pagos se realizan en persona el día de la prueba; la web no recibe ni guarda datos de pago",
            "Publicación: nombre y resultados solo si el jugador activa la visibilidad pública; el resto aparece como 'Jugador privado'",
            "Plazos de conservación, incluido el de los mensajes de contacto",
            "Derechos de acceso, rectificación, supresión, limitación, oposición y portabilidad",
            "Derecho a reclamar ante la Agencia Española de Protección de Datos (AEPD)",
        ],
        palabrasClave: ["Supabase", "AEPD", "Unión Europea"],
        ruta: "/privacidad",
    },
    {
        tipo: "cookies",
        nombre: "Política de cookies",
        baseLegal: "LSSI-CE art. 22.2; guía de cookies de la AEPD",
        contenidoMinimo: [
            "Listado de cookies técnicas: nombre, finalidad y duración",
            "Cookies de sesión de Supabase: técnicas, no requieren consentimiento",
            "Si se añade analítica o publicidad: banner de consentimiento previo a su carga",
            "Cómo borrarlas desde el navegador",
        ],
        palabrasClave: ["cookies"],
        ruta: "/cookies",
    },
    {
        tipo: "condiciones_inscripcion",
        nombre: "Condiciones de participación",
        baseLegal: "Condiciones de uso del servicio de inscripción",
        contenidoMinimo: [
            "La inscripción en la web es una solicitud de plaza: queda pendiente hasta que el organizador la confirma",
            "La inscripción en la web es gratuita y no implica ningún pago",
            "El precio por pareja se indica en cada prueba y se abona en persona el primer día, en el lugar que se indique",
            "Plazas limitadas por prueba: si se llena, la inscripción pasa a lista de espera",
            "Categoría que no alcanza 3 parejas: no se disputa y no se cobra",
            "Retirada desde la web: gratuita hasta que la prueba esté en curso",
            "Causas de fuerza mayor, aplazamientos y cancelaciones del organizador",
        ],
        palabrasClave: ["pendiente", "3 parejas"],
        ruta: "/condiciones",
    },
    {
        tipo: "reglamento",
        nombre: "Reglamento del circuito",
        baseLegal: "Normas de participación",
        contenidoMinimo: [
            "Formato de grupos y fases finales",
            "Criterios de desempate",
            "Sistema de puntos y ventana de 12 meses",
            "Normas de conducta y sanciones",
            "Uso de imagen durante las pruebas",
            "Menores de edad: autorización del tutor legal",
        ],
        palabrasClave: ["desempate", "puntos"],
        ruta: "/reglamento",
    },
];

export const RUTA_DOCUMENTO: Record<TipoDocumento, string> = Object.fromEntries(
    REQUISITOS.map((r) => [r.tipo, r.ruta])
) as Record<TipoDocumento, string>;

// Requisitos que todavía no tienen una versión vigente publicada.
export function faltantes(vigentes: readonly TipoDocumento[]): Requisito[] {
    const publicados = new Set(vigentes);
    return REQUISITOS.filter((r) => !publicados.has(r.tipo));
}

// Comprobación orientativa: detecta palabras clave ausentes en el texto.
// No sustituye la revisión legal; evita publicar un borrador incompleto por descuido.
export function palabrasQueFaltan(tipo: TipoDocumento, contenido: string): string[] {
    const requisito = REQUISITOS.find((r) => r.tipo === tipo);
    if (!requisito) return [];
    const texto = contenido.toLowerCase();
    return requisito.palabrasClave.filter((p) => !texto.includes(p.toLowerCase()));
}