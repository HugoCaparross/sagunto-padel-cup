import { requireAdmin } from "@/lib/auth/session";
import { PageHeader, EmptyState } from "@/components/crm/ui";
import { formatDate } from "@/lib/format";
import { saveSettings, grantAdmin, revokeAdmin } from "./actions";
import styles from "@/components/crm/crm.module.css";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string; ok?: string }>;
}) {
    const { error, ok } = await searchParams;
    const { supabase } = await requireAdmin("/admin/configuracion");

    const [settingsRes, adminsRes] = await Promise.all([
        supabase.from("app_settings").select("key,value"),
        supabase.rpc("list_admins"),
    ]);

    const s: Record<string, any> = Object.fromEntries(
        (settingsRes.data ?? []).map((r: any) => [r.key, r.value]),
    );
    const admins = (adminsRes.data ?? []) as any[];

    return (
        <>
            <PageHeader eyebrow="Sistema" title="Configuración" />

            {error && <p className={styles.alertError} role="alert">{error}</p>}
            {ok && <p className={styles.alertSuccess} role="status">{ok}</p>}

            <section className={styles.card} style={{ marginBottom: 24 }}>
                <h2 className={styles.cardTitle}>Ajustes generales</h2>

                <form action={saveSettings} className={styles.form}>
                    <label className={styles.field}>
                        <span>Nombre del circuito</span>
                        <input name="site_name" required minLength={2} maxLength={80} defaultValue={s.site_name ?? ""} />
                    </label>

                    <label className={styles.field}>
                        <span>Correo de contacto</span>
                        <input type="email" name="contact_email" required defaultValue={s.contact_email ?? ""} />
                    </label>

                    <label className={styles.field}>
                        <span>Teléfono de contacto</span>
                        <input name="contact_phone" maxLength={30} defaultValue={s.contact_phone ?? ""} />
                    </label>

                    <label className={styles.check}>
                        <input type="checkbox" name="maintenance_mode" defaultChecked={!!s.maintenance_mode} />
                        <span>Modo mantenimiento (la web pública no está disponible)</span>
                    </label>

                    <label className={styles.field}>
                        <span>Motivo (obligatorio si cambias el modo mantenimiento)</span>
                        <textarea name="reason" rows={2} />
                    </label>

                    <div>
                        <button className={styles.btnPrimary} type="submit">Guardar ajustes</button>
                    </div>
                </form>
            </section>

            <section className={styles.card} style={{ marginBottom: 24 }}>
                <h2 className={styles.cardTitle}>Administradores</h2>

                {admins.length === 0 ? (
                    <EmptyState title="Sin administradores" text="Algo no cuadra: debería existir al menos uno." />
                ) : (
                    <div className={styles.tableWrap} style={{ marginBottom: 20 }}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Correo</th>
                                    <th>Concedido</th>
                                    <th>Retirar rol</th>
                                </tr>
                            </thead>
                            <tbody>
                                {admins.map((a) => (
                                    <tr key={a.user_id}>
                                        <td>
                                            <strong>{a.email}</strong>
                                            {a.is_me && <span className={styles.muted}> (tú)</span>}
                                        </td>
                                        <td className={styles.muted}>{formatDate(a.granted_at)}</td>
                                        <td>
                                            {a.is_me ? (
                                                <span className={styles.muted}>—</span>
                                            ) : (
                                                <form action={revokeAdmin} className={styles.toolbar} style={{ margin: 0 }}>
                                                    <input type="hidden" name="user_id" value={a.user_id} />
                                                    <input className={styles.input} name="reason" placeholder="Motivo" required minLength={5} />
                                                    <label className={styles.check}>
                                                        <input type="checkbox" name="confirm" required />
                                                        <span>Confirmo</span>
                                                    </label>
                                                    <button className={styles.btnGhost} type="submit">Retirar</button>
                                                </form>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <h3 className={styles.cardTitle}>Conceder rol</h3>
                <p className={styles.muted} style={{ fontSize: 13, marginTop: 0 }}>
                    La persona debe tener cuenta en la web antes. El cambio queda registrado en auditoría.
                </p>
                <form action={grantAdmin} className={styles.toolbar}>
                    <input className={`${styles.input} ${styles.search}`} type="email" name="email" placeholder="correo@ejemplo.com" required />
                    <input className={`${styles.input} ${styles.search}`} name="reason" placeholder="Motivo" required minLength={5} />
                    <button className={styles.btnPrimary} type="submit">Conceder</button>
                </form>
            </section>
        </>
    );
}