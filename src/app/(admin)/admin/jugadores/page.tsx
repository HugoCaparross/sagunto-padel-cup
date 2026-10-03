import Link from "next/link";
import type { PlayerStatus } from "@/types/database";
import { getAdminPlayers } from "@/lib/services/admin";

import styles from "../admin-list.module.css";

type SearchParams = Promise<{ q?: string; estado?: string }>;
const PLAYER_STATES: PlayerStatus[] = ["activo", "suspendido", "baja"];
const STATE_LABELS: Record<PlayerStatus, string> = {
    activo: "Activo",
    suspendido: "Suspendido",
    baja: "Baja",
};

export default async function AdminPlayersPage({ searchParams }: { searchParams: SearchParams }) {
    const params = await searchParams;
    const search = params.q?.trim() ?? "";
    const status = PLAYER_STATES.includes(params.estado as PlayerStatus)
        ? params.estado as PlayerStatus
        : undefined;
    const players = await getAdminPlayers({ search, estado: status });

    return (
        <main className={styles.page}>
            <header className={styles.header}>
                <div>
                    <span className={styles.eyebrow}>Participantes</span>
                    <h1 className={styles.title}>Jugadores</h1>
                    <p className={styles.description}>Consulta el estado deportivo de los jugadores registrados. Los datos de contacto no se muestran en este listado.</p>
                </div>
                <span className={styles.count}>{players.length} {players.length === 1 ? "jugador" : "jugadores"}</span>
            </header>

            <section className={styles.panel} aria-label="Listado de jugadores">
                <form action="/admin/jugadores" method="GET" className={styles.toolbar}>
                    <div className={styles.field}>
                        <label htmlFor="player-search">Buscar jugador</label>
                        <input id="player-search" className={styles.input} type="search" name="q" defaultValue={search} placeholder="Nombre o apellidos" />
                    </div>
                    <div className={styles.field}>
                        <label htmlFor="player-status">Estado</label>
                        <select id="player-status" className={styles.select} name="estado" defaultValue={status ?? ""}>
                            <option value="">Todos</option>
                            {PLAYER_STATES.map((value) => <option key={value} value={value}>{STATE_LABELS[value]}</option>)}
                        </select>
                    </div>
                    <button className={styles.button} type="submit">Aplicar filtros</button>
                    {(search || status) && <Link className={styles.quietButton} href="/admin/jugadores">Limpiar</Link>}
                </form>

                {players.length === 0 ? (
                    <div className={styles.empty}>
                        <h2>{search || status ? "No hay resultados" : "Aún no hay jugadores"}</h2>
                        <p>{search || status ? "Prueba a cambiar o limpiar los filtros." : "Los jugadores aparecerán aquí cuando se registren en el circuito."}</p>
                    </div>
                ) : (
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead><tr><th scope="col">Jugador</th><th scope="col">Categoría</th><th scope="col">Localidad</th><th scope="col">Estado</th></tr></thead>
                            <tbody>
                                {players.map((player) => (
                                    <tr key={player.id}>
                                        <td><Link className={styles.primaryText} href={`/admin/jugadores/${player.id}`}>{player.nombre} {player.apellidos}</Link></td>
                                        <td>{player.category?.nombre ?? "Sin categoría"}</td>
                                        <td>{player.ciudad || "—"}</td>
                                        <td><span className={`${styles.badge} ${player.estado === "activo" ? styles.success : player.estado === "suspendido" ? styles.warning : styles.neutral}`}>{STATE_LABELS[player.estado]}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
            <p className={styles.privateNote}>El acceso y la búsqueda de datos sensibles están limitados al personal administrador autenticado.</p>
        </main>
    );
}
