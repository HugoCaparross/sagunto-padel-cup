import Link from "next/link";
import type { RegistrationStatus } from "@/types/database";
import { getAdminRegistrations, getCategories } from "@/lib/services/admin";
import { getTournaments } from "@/lib/services/tournaments";

import { cancelRegistrationAction, checkInAction, confirmRegistrationAction, moveRegistrationToWaitingListAction, promoteWaitingRegistrationAction, verifyPaymentAction } from "./actions";
import RegistrationMutationForm from "./RegistrationMutationForm";
import styles from "../admin-list.module.css";

type SearchParams = Promise<{ q?: string; torneo?: string; categoria?: string; estado?: string; pago?: string; resultado?: string }>;
const REGISTRATION_STATES: RegistrationStatus[] = ["confirmada", "lista_espera", "pendiente_pago", "cancelada"];
const PAYMENT_STATES = ["pendiente", "verificado", "rechazado", "no_aplicable"] as const;
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
    if (status === "no_aplicable") return "No aplicable";
    return "Pendiente";
}

export default async function AdminRegistrationsPage({ searchParams }: { searchParams: SearchParams }) {
    const params = await searchParams;
    const search = params.q?.trim() ?? "";
    const tournamentId = params.torneo ?? "";
    const status = REGISTRATION_STATES.includes(params.estado as RegistrationStatus) ? params.estado as RegistrationStatus : undefined;
    const payment = PAYMENT_STATES.includes(params.pago as typeof PAYMENT_STATES[number]) ? params.pago as typeof PAYMENT_STATES[number] : undefined;
    const [categories, tournaments] = await Promise.all([
        getCategories(),
        getTournaments(),
    ]);
    const categoryId = categories.some((category) => category.id === params.categoria) ? params.categoria : "";
    const allRegistrations = await getAdminRegistrations({ tournamentId: tournamentId || undefined, categoryId: categoryId || undefined, estado: status, paymentStatus: payment });
    const query = search.toLocaleLowerCase("es");
    const registrations = allRegistrations.filter((registration) => {
        if (!query) return true;
        const playerName = `${registration.player?.nombre ?? ""} ${registration.player?.apellidos ?? ""}`;
        return `${playerName} ${registration.tournament?.nombre ?? ""}`.toLocaleLowerCase("es").includes(query);
    });
    const activeFilters = new URLSearchParams();
    if (search) activeFilters.set("q", search);
    if (tournamentId) activeFilters.set("torneo", tournamentId);
    if (categoryId) activeFilters.set("categoria", categoryId);
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

            {params.resultado === "auditoria_error" && <p className={`${styles.feedback} ${styles.warning}`} role="alert">La operaciÃ³n se completÃ³, pero no se pudo guardar su registro de auditorÃ­a.</p>}
            {status === "lista_espera" && <p className={`${styles.feedback} ${styles.warning}`} role="note">La promociÃ³n es manual: selecciona una pareja concreta. No hay una prioridad oficial documentada, por lo que la lista no se promueve automÃ¡ticamente.</p>}

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
                        <label htmlFor="registration-category">Categoria</label>
                        <select id="registration-category" className={styles.select} name="categoria" defaultValue={categoryId}>
                            <option value="">Todas</option>
                            {categories.map((category) => <option key={category.id} value={category.id}>{category.nombre}</option>)}
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
                    {(search || tournamentId || categoryId || status || payment) && <Link className={styles.quietButton} href="/admin/inscripciones">Limpiar</Link>}
                </form>

                {registrations.length === 0 ? (
                    <div className={styles.empty}>
                        <h2>{search || tournamentId || status || payment ? "No hay resultados" : "Aún no hay inscripciones"}</h2>
                        <p>{search || tournamentId || status || payment ? "Cambia o limpia los filtros para consultar otras inscripciones." : "Las inscripciones recibidas aparecerán aquí."}</p>
                    </div>
                ) : (
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead><tr><th scope="col">Jugador / pareja</th><th scope="col">Torneo</th><th scope="col">Categoria</th><th scope="col">Estado</th><th scope="col">Pago</th><th scope="col">Check-in</th><th scope="col">Acciones</th></tr></thead>
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
                                                <Link className={styles.primaryText} href={`/admin/inscripciones/${registration.id}`}>{playerName}</Link>
                                                <span className={styles.secondaryText}>{registration.pair?.player_2_id ? "Inscripción en pareja" : "Inscripción individual"}</span>
                                            </td>
                                            <td>{registration.tournament?.nombre ?? "Torneo no disponible"}</td>
                                            <td>{categories.find((category) => category.id === (registration.categoria_id ?? registration.pair?.categoria_id))?.nombre ?? "Sin categoria"}</td>
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
                                                    {registrationState === "pendiente_pago" && ["verificado", "no_aplicable"].includes(paymentState) && registration.pair?.player_2_id && (
                                                        <form action={confirmRegistrationAction}>
                                                            <input type="hidden" name="registrationId" value={registration.id} />
                                                            <input type="hidden" name="returnTo" value={returnTo} />
                                                            <button className={styles.smallButton} type="submit">Confirmar inscripción</button>
                                                        </form>
                                                    )}
                                                    {registrationState === "lista_espera" && registration.pair?.player_1_id && registration.pair.player_2_id && (
                                                        <RegistrationMutationForm action={promoteWaitingRegistrationAction} registrationId={registration.id} returnTo={returnTo} confirmation="Confirmas promover esta pareja a pendiente de pago? Solo se completara si hay cupo, las inscripciones siguen abiertas y no hay partidos creados en la categoria.">Promover manualmente</RegistrationMutationForm>
                                                    )}
                                                    {["pendiente_pago", "confirmada"].includes(registrationState) && !registration.checked_in && (
                                                        <RegistrationMutationForm action={moveRegistrationToWaitingListAction} registrationId={registration.id} returnTo={returnTo} confirmation="Confirmas mover esta inscripcion a lista de espera? Se conserva cualquier pago registrado y no se promueve otra pareja automaticamente.">Mover a espera</RegistrationMutationForm>
                                                    )}
                                                    {registrationState !== "cancelada" && (
                                                        <RegistrationMutationForm action={cancelRegistrationAction} registrationId={registration.id} returnTo={returnTo} confirmation="Confirmas cancelar esta inscripcion? Se conservara el historial y cualquier pago verificado; esta accion no inicia un reembolso. La cancelacion se bloquea si ya hay check-in, el torneo empezo o la pareja tiene partidos.">Cancelar</RegistrationMutationForm>
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
