export const NAVEGACION_PRINCIPAL = [
    { href: "/calendario", texto: "Calendario" },
    { href: "/ranking", texto: "Ranking" },
    { href: "/premios", texto: "Premios" },
    { href: "/noticias", texto: "Noticias" },
] as const;

export const NAVEGACION_MAS = [
    { href: "/circuito", texto: "El Circuito" },
    { href: "/puntos", texto: "Puntos" },
    { href: "/contacto", texto: "Contacto" },
    { href: "/faq", texto: "Preguntas frecuentes" },
    { href: "/patrocinadores", texto: "Patrocinadores" },
] as const;

export const NAVEGACION_MOVIL = [...NAVEGACION_PRINCIPAL, ...NAVEGACION_MAS];
