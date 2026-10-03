"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createNews, updateNews } from "@/lib/services/admin";

function readText(formData: FormData, key: string): string {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
}

function slugify(value: string): string {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
        .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function createNewsAction(formData: FormData): Promise<void> {
    const title = readText(formData, "title");
    const slug = slugify(readText(formData, "slug") || title);
    const excerpt = readText(formData, "excerpt");
    const content = readText(formData, "content");

    if (!title || title.length > 160 || !slug || slug.length > 160 || excerpt.length > 400 || content.length > 12000) {
        redirect("/admin/contenidos?resultado=datos-invalidos");
    }

    try {
        await createNews({ title, slug, excerpt: excerpt || null, content, published: false });
    } catch (error) {
        console.error("[Admin] No se pudo crear el contenido", error);
        redirect("/admin/contenidos?resultado=error");
    }

    revalidatePath("/admin/contenidos");
    revalidatePath("/noticias");
    redirect("/admin/contenidos?resultado=creado");
}

export async function setNewsPublishedAction(formData: FormData): Promise<void> {
    const newsId = readText(formData, "newsId");
    const publishedValue = readText(formData, "published");
    if (!newsId || !["true", "false"].includes(publishedValue)) {
        redirect("/admin/contenidos?resultado=datos-invalidos");
    }

    try {
        await updateNews(newsId, { published: publishedValue === "true" });
    } catch (error) {
        console.error("[Admin] No se pudo actualizar la publicación", error);
        redirect("/admin/contenidos?resultado=error");
    }

    revalidatePath("/admin/contenidos");
    revalidatePath("/noticias");
    redirect("/admin/contenidos?resultado=actualizado");
}
