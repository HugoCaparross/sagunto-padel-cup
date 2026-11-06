export function slugify(text: string) {
    const base = text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    // Sufijo corto para evitar colisiones con el UNIQUE de slug.
    return `${base || "item"}-${Math.random().toString(36).slice(2, 7)}`;
}