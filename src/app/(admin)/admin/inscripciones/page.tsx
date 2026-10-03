import type { RegistrationStatus } from "@/types/database";
import { getAdminRegistrations } from "@/lib/services/admin";
import { getTournaments } from "@/lib/services/tournaments";

import { checkInAction, confirmRegistrationAction, verifyPaymentAction } from "./actions";
import styles from "../admin-list.module.css";

type SearchParams = Promise<{ q?: string; torneo?: string; estado?: string; pago?: string; resultado?: string }>;
const REGISTRATION_STATES: RegistrationStatus[] = ["confirmada", "lista_espera", "pendiente_pago", "cancelada"];
const PAYMENT_STATES = ["pendiente", "verificado", "rechazado", "no_requerido"] as const;
const REGISTRATION_LABELS: Record<RegistrationStatus, string> = {
    confirmada: "Confirmada",
    lista_espera: "Lista de espera",
    pendiente_pago: "Pendiente de pago",
    cancelada: "Cancelada",
};

function getBadgeTone(status: string): string {
    if (["confirmada", "verificado"].includes(status)) return styles.success;
    if (["pendiente_pago", "pendiente", "lista_espera"].includes(status)) return styles.warning;
    if (["cancelada", "rechazado"].includes(status)) return styles.danger;
    return styles.neutral;
}

function getPaymentLabel(status: string | undefined): string {
    if (status === "verificado") return "Verificado";
    if (status === "rechazado") return "Rechazado";
    if (status === "no_requerido") return "No requerido";
    return "Pendiente";
}

export default async function AdminRegistrationsPage({ searchParams }: { searchParams: SearchParams }) {
    const params = await searchParams;
    const search = params.q?.trim() ?? "";
    const tournamentId = params.torneo ?? "";
    const status = REGISTRATION_STATES.includes(params.estado as RegistrationStatus) ? params.estado as RegistrationStatus : undefined;
    const payment = PAYMENT_STATES.includes(params.pago as typeof PAYMENT_STATES[number]) ? params.pago as typeof PAYMENT_STATES[number] : undefined;
    const [allRegistrations, tournaments] = await Promise.all([
        getAdminRegistrations({ tournamentId: tournamentId || undefined, estado: status, paymentStatus: payment }),
        getTournaments(),
    ]);
    const query = search.toLocaleLowerCase("es");
    const registrations = allRegistrations.filter((registration) => {
        if (!query) return true;
        const playerName = `${registration.player?.nombre ?? ""} ${registration.player?.apellidos ?? ""}`;
        return `${playerName} ${registration.tournament?.nombre ?? ""}`.toLocaleLowerCase("es").includes(query);
    });
    const activeFilters = new URLSearchParams();
    if (search) activeFilters.set("q", search);
    if (tournamentId) activeFilters.set("torneo", tournamentId);
    if (status) activeFilters.set("estado", status);
    if (payment) activeFilters.set("pago", payment);
    const returnTo = `/admin/inscripciones${activeFilters.size ? `?${activeFilters.toString()}` : ""}`;

    return (
        <main className={styles.page}>
            <header className={styles.header}>
                <div>
                    <span className={styles.eyebrow}>Competición</span>
                    <h1 className={styles.title}>Inscripciones</h1>
                    <p className={styles.description}>Revisa el estado de las solicitudes, verifica pagos externos y registra el check-in de parejas confirmadas.</p>
                </div>
                <span className={styles.count}>{registrations.length} {registrations.length === 1 ? "inscripción" : "inscripciones"}</span>
            </header>

            {params.resultado === "actualizada" && <p className={styles.feedback} role="status">La inscripción se ha actualizado.</p>}
            {params.resultado === "error" && <p className={`${styles.feedback} ${styles.danger}`} role="alert">No se pudo completar la operación. Comprueba el estado y vuelve a intentarlo.</p>}

            <section className={styles.panel} aria-label="Listado de inscripciones">
                <form action="/admin/inscripciones" method="GET" className={styles.toolbar}>
                    <div className={styles.field}>
                        <label htmlFor="registration-search">Buscar</label>
                        <input id="registration-search" className={styles.input} type="search" name="q" defaultValue={search} placeholder="Jugador o torneo" />
                    </div>
                    <div className={styles.field}>
                        <label htmlFor="registration-tournament">Torneo</label>
                        <select id="registration-tournament" className={styles.select} name="torneo" defaultValue={tournamentId}>
                            <option value="">Todos los torneos</option>
                            {tournaments.map((tournament) => <option key={tournament.id} value={tournament.id}>{tournament.nombre}</option>)}
                        </select>
                    </div>
                    <div className={styles.field}>
                        <label htmlFor="registration-state">Estado</label>
                        <select id="registration-state" className={styles.select} name="estado" defaultValue={status ?? ""}>
                            <option value="">Todos</option>
                            {REGISTRATION_STATES.map((value) => <option key={value} value={value}>{REGISTRATION_LABELS[value]}</option>)}
                        </select>
                    </div>
                    <div className={styles.field}>
                        <label htmlFor="registration-payment">Pago</label>
                        <select id="registration-payment" className={styles.select} name="pago" defaultValue={payment ?? ""}>
                            <option value="">Todos</option>
                            {PAYMENT_STATES.map((value) => <option key={value} value={value}>{getPaymentLabel(value)}</option>)}
                        </select>
                    </div>
                    <button className={styles.button} type="submit">Filtrar</button>
                    {(search || tournamentId || status || payment) && <a className={styles.quietButton} href="/admin/inscripciones">Limpiar</a>}
                </form>

                {registrations.length === 0 ? (
                    <div className={styles.empty}>
                        <h2>{search || tournamentId || status || payment ? "No hay resultados" : "Aún no hay inscripciones"}</h2>
                        <p>{search || tournamentId || status || payment ? "Cambia o limpia los filtros para consultar otras inscripciones." : "Las inscripciones recibidas aparecerán aquí."}</p>
                    </div>
                ) : (
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead><tr><th scope="col">Jugador / pareja</th><th scope="col">Torneo</th><th scope="col">Estado</th><th scope="col">Pago</th><th scope="col">Check-in</th><th scope="col">Acciones</th></tr></thead>
                            <tbody>
                                {registrations.map((registration) => {
                                    const registrationState = registration.estado;
                                    const paymentState = registration.payment_status ?? "pendiente";
                                    const playerName = registration.player
                                        ? `${registration.player.nombre} ${registration.player.apellidos}`
                                        : "Jugador sin perfil";
                                    return (
                                        <tr key={registration.id}>
                                            <td>
                                                <span className={styles.primaryText}>{playerName}</span>
                                                <span className={styles.secondaryText}>{registration.pair?.player_2_id ? "Inscripción en pareja" : "Inscripción individual"}</span>
                                            </td>
                                            <td>{registration.tournament?.nombre ?? "Torneo no disponible"}</td>
                                            <td><span className={`${styles.badge} ${getBadgeTone(registrationState)}`}>{REGISTRATION_LABELS[registrationState]}</span></td>
                                            <td><span className={`${styles.badge} ${getBadgeTone(paymentState)}`}>{getPaymentLabel(paymentState)}</span></td>
                                            <td>{registration.checked_in ? <span className={`${styles.badge} ${styles.success}`}>Realizado</span> : <span className={`${styles.badge} ${styles.neutral}`}>Pendiente</span>}</td>
                                            <td>
                                                <div className={styles.rowActions}>
                                                    {paymentState !== "verificado" && registrationState !== "cancelada" && (
                                                        <form action={verifyPaymentAction} className={styles.inlineForm}>
                                                            <input type="hidden" name="registrationId" value={registration.id} />
                                                            <input type="hidden" name="returnTo" value={returnTo} />
                                                            <select className={styles.inlineSelect} name="method" aria-label={`Método de pago de ${playerName}`} defaultValue="fisico">
                                                                <option value="fisico">Efectivo</option><option value="transferencia">Transferencia</option><option value="otro">Otro</option>
                                                            </select>
                                                            <button className={styles.smallButton} type="submit">Verificar pago</button>
                                                        </form>
                                                    )}
                                                    {registrationState === "confirmada" && !registration.checked_in && (
                                                        <form action={checkInAction}>
                                                            <input type="hidden" name="registrationId" value={registration.id} />
                                                            <input type="hidden" name="returnTo" value={returnTo} />
                                                            <button className={styles.smallButton} type="submit">Registrar check-in</button>
                                                        </form>
                                                    )}
                                                    {registrationState === "pendiente_pago" && ["verificado", "no_requerido"].includes(paymentState) && registration.pair?.player_2_id && (
                                                        <form action={confirmRegistrationAction}>
                                                            <input type="hidden" name="registrationId" value={registration.id} />
                                                            <input type="hidden" name="returnTo" value={returnTo} />
                                                            <button className={styles.smallButton} type="submit">Confirmar inscripción</button>
                                                        </form>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    );
}
