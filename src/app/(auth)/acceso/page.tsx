import { signIn } from "@/lib/auth/actions";
import styles from "@/components/crm/crm.module.css";

export const metadata = {
    title: "Acceso | Sagunto Padel Cup",
};

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string; next?: string }>;
}) {
    const { error, next } = await searchParams;

    return (
        <main className={styles.authWrap}>
            <section className={styles.authCard}>
                <p className={styles.eyebrow}>Área de jugador</p>
                <h1 className={styles.authTitle}>INICIA SESIÓN</h1>
                <p className={styles.muted}>
                    Accede para gestionar tus inscripciones, consultar tus
                    resultados y seguir tu ranking.
                </p>

                {error === "credenciales" && (
                    <p className={styles.alertError} role="alert">
                        Correo o contraseña incorrectos.
                    </p>
                )}

                <form action={signIn} className={styles.form}>
                    <input type="hidden" name="next" value={next ?? ""} />

                    <label className={styles.field}>
                        <span>Correo electrónico</span>
                        <input type="email" name="email" required autoComplete="email" placeholder="tu@email.com" />
                    </label>

                    <label className={styles.field}>
                        <span>Contraseña</span>
                        <input type="password" name="password" required autoComplete="current-password" />
                    </label>

                    <button type="submit" className={styles.btnPrimary}>
                        Iniciar sesión
                    </button>
                </form>

                <p className={styles.safeNote}>
                    Acceso privado para jugadores registrados. Tus datos se tratan de forma segura.
                </p>
            </section>
        </main>
    );
}