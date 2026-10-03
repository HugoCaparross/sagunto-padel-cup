import type { NewsStatus } from "@/types/database";
import { getAdminNews } from "@/lib/services/admin";

import { createNewsAction, setNewsPublishedAction } from "./actions";
import styles from "../admin-list.module.css";

type SearchParams = Promise<{ estado?: string; resultado?: string }>;
const CONTENT_STATES: NewsStatus[] = ["borrador", "publicado"];
const CONTENT_LABELS: Record<NewsStatus, string> = { borrador: "Borrador", publicado: "Publicado" };

export default async function AdminContentPage({ searchParams }: { searchParams: SearchParams }) {
    const params = await searchParams;
    const selected = CONTENT_STATES.includes(params.estado as NewsStatus) ? params.estado as NewsStatus : undefined;
    const allNews = await getAdminNews();
    const news = selected ? allNews.filter((item) => item.estado === selected) : allNews;

    return (
        <main className={styles.page}>
            <header className={styles.header}>
                <div><span className={styles.eyebrow}>Comunicación</span><h1 className={styles.title}>Contenidos</h1><p className={styles.description}>Crea noticias como borrador y publica o retira publicaciones. Los cambios se reflejan en la sección pública de noticias.</p></div>
                <span className={styles.count}>{allNews.length} publicaciones</span>
            </header>

            {params.resultado === "creado" && <p className={styles.feedback} role="status">Borrador creado.</p>}
            {params.resultado === "actualizado" && <p className={styles.feedback} role="status">Estado de publicación actualizado.</p>}
            {params.resultado === "datos-invalidos" && <p className={`${styles.feedback} ${styles.danger}`} role="alert">Revisa los campos y sus longitudes máximas.</p>}
            {params.resultado === "error" && <p className={`${styles.feedback} ${styles.danger}`} role="alert">No se pudo guardar el contenido. Comprueba que el identificador de URL no esté repetido.</p>}

            <section className={styles.panel} aria-label="Crear noticia">
                <form action={createNewsAction} className={styles.toolbar}>
                    <div className={styles.field}><label htmlFor="content-title">Título</label><input id="content-title" className={styles.input} name="title" required maxLength={160} /></div>
                    <div className={styles.field}><label htmlFor="content-slug">Identificador URL (opcional)</label><input id="content-slug" className={styles.input} name="slug" maxLength={160} placeholder="Se genera desde el título" /></div>
                    <div className={styles.field}><label htmlFor="content-excerpt">Resumen</label><input id="content-excerpt" className={styles.input} name="excerpt" maxLength={400} /></div>
                    <div className={`${styles.field} ${styles.fullField}`}><label htmlFor="content-body">Contenido</label><textarea id="content-body" className={`${styles.input} ${styles.textArea}`} name="content" rows={5} maxLength={12000} /></div>
                    <button className={styles.button} type="submit">Guardar borrador</button>
                </form>
            </section>

            <section className={`${styles.panel} ${styles.contentPanel}`} aria-label="Listado de noticias">
                <form action="/admin/contenidos" method="GET" className={styles.toolbar}>
                    <div className={styles.field}><label htmlFor="content-state">Estado de publicación</label><select id="content-state" className={styles.select} name="estado" defaultValue={selected ?? ""}><option value="">Todos</option>{CONTENT_STATES.map((state) => <option key={state} value={state}>{CONTENT_LABELS[state]}</option>)}</select></div>
                    <button className={styles.quietButton} type="submit">Filtrar</button>
                    {selected && <a className={styles.link} href="/admin/contenidos">Limpiar</a>}
                </form>
                {!news.length ? (
                    <div className={styles.empty}><h2>{selected ? "No hay contenidos en este estado" : "Aún no hay noticias"}</h2><p>{selected ? "Prueba con otro filtro." : "Crea un borrador con el formulario para empezar."}</p></div>
                ) : (
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead><tr><th scope="col">Publicación</th><th scope="col">Estado</th><th scope="col">Creada</th><th scope="col">Acción</th></tr></thead>
                            <tbody>{news.map((item) => (
                                <tr key={item.id}>
                                    <td><span className={styles.primaryText}>{item.titulo}</span><span className={styles.secondaryText}>/noticias/{item.slug}</span>{item.excerpt && <span className={styles.secondaryText}>{item.excerpt}</span>}</td>
                                    <td><span className={`${styles.badge} ${item.estado === "publicado" ? styles.success : styles.warning}`}>{CONTENT_LABELS[item.estado]}</span></td>
                                    <td>{new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeZone: "Europe/Madrid" }).format(new Date(item.created_at))}</td>
                                    <td><form action={setNewsPublishedAction}><input type="hidden" name="newsId" value={item.id} /><input type="hidden" name="published" value={item.estado !== "publicado" ? "true" : "false"} /><button className={styles.smallButton} type="submit">{item.estado === "publicado" ? "Pasar a borrador" : "Publicar"}</button></form></td>
                                </tr>
                            ))}</tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    );
}
