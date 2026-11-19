// Documentos legales de la web.
// Adaptado a: web informativa, inscripciones registradas y confirmadas por el organizador,
// pago en efectivo el primer día de la prueba, datos alojados en Supabase (Frankfurt, UE),
// responsable: Hugo Caparrós, bajo el nombre comercial Sagunto Padel Cup.
//
// Pendiente (LSSI-CE art. 10): sin NIF ni domicilio publicados, mientras haya cobros.

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
        baseLegal: "Ley 34/2002 (LSSI-CE), art. 10",
        contenidoMinimo: [
            "Titular: Hugo Caparrós, bajo el nombre comercial Sagunto Padel Cup",
            "Email de contacto",
            "Objeto de la web",
            "Aclaración de que la web no procesa pagos",
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
            "Responsable: Hugo Caparrós, con email para ejercer derechos",
            "Datos tratados y finalidades con base jurídica de cada uno",
            "Encargado: Supabase, región Frankfurt (Unión Europea)",
            "Pagos en efectivo: la web no guarda datos de pago",
            "Publicación: nombre y resultados solo con visibilidad pública activada",
            "Plazos de conservación",
            "Derechos y reclamación ante la AEPD",
        ],
        palabrasClave: ["Supabase", "AEPD", "Unión Europea"],
        ruta: "/privacidad",
    },
    {
        tipo: "cookies",
        nombre: "Política de cookies",
        baseLegal: "LSSI-CE art. 22.2; guía de cookies de la AEPD",
        contenidoMinimo: [
            "Cookies técnicas de sesión (Supabase), sin consentimiento necesario",
            "Declaración de que no hay analítica ni publicidad",
            "Compromiso de pedir consentimiento antes de añadir cookies no técnicas",
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
            "La inscripción en la web es una solicitud pendiente hasta que el organizador la confirma",
            "Precio por pareja indicado en cada prueba, pagado en efectivo el primer día",
            "Categoría con menos de 3 parejas: no se disputa y no se cobra",
            "Retirada sin coste mientras la prueba no esté en curso",
            "Pareja que no se presenta sin avisar: no paga la inscripción",
            "Desistimiento no aplicable a servicios de ocio con fecha determinada (art. 103 TRLGDCU)",
            "Cancelación o cambios por el organizador, fuerza mayor y responsabilidad",
        ],
        palabrasClave: ["efectivo", "3 parejas"],
        ruta: "/condiciones",
    },
    {
        tipo: "reglamento",
        nombre: "Reglamento del circuito",
        baseLegal: "Normas de participación",
        contenidoMinimo: [
            "Categorías y formato de grupos y fases finales",
            "Formato de partido por fase",
            "Desempates en grupos",
            "Puntos por jugador y ventana de 12 meses",
            "Puntualidad e incomparecencia",
            "Conducta y sanciones",
            "Imagen y menores de edad",
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