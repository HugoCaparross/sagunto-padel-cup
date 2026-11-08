export type AdminNavGroup = {
    area: string;
    items: { href: string; label: string }[];
};

// Siete áreas según la especificación. Las páginas que se fusionarán en la ficha de prueba
// (inscripciones, cuadros) y en Puntuación siguen aquí de forma temporal.
export const ADMIN_NAV: AdminNavGroup[] = [
    {
        area: "Inicio",
        items: [{ href: "/admin", label: "Pendientes" }],
    },
    {
        area: "Circuito",
        items: [
            { href: "/admin/temporadas", label: "Temporadas" },
            { href: "/admin/pruebas", label: "Pruebas" },
            { href: "/admin/inscripciones", label: "Inscripciones" },
            { href: "/admin/cuadros", label: "Cuadros" },
        ],
    },
    {
        area: "Personas",
        items: [
            { href: "/admin/jugadores", label: "Jugadores" },
            { href: "/admin/categorias/asignaciones", label: "Asignaciones" },
        ],
    },
    {
        area: "Puntuación",
        items: [
            { href: "/admin/ranking", label: "Ranking" },
            { href: "/admin/cierre", label: "Cierre 70/30" },
            { href: "/admin/reglas", label: "Reglas" },
            { href: "/admin/ajustes", label: "Ajustes de puntos" },
        ],
    },
    {
        area: "Máster Final",
        items: [
            { href: "/admin/master", label: "Clasificación" },
            { href: "/admin/master/resultados", label: "Resultados" },
        ],
    },
    {
        area: "Contenido",
        items: [
            { href: "/admin/noticias", label: "Noticias" },
            { href: "/admin/clubes", label: "Clubes" },
            { href: "/admin/patrocinadores", label: "Patrocinadores" },
        ],
    },
    {
        area: "Sistema",
        items: [
            { href: "/admin/categorias", label: "Categorías y subgrupos" },
            { href: "/admin/configuracion", label: "Configuración" },
            { href: "/admin/auditoria", label: "Auditoría" },
        ],
    },
];