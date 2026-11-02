
"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import styles from "./login.module.css";

function getSafeNextPath(value: string | null): string {
    if (
        !value ||
        !value.startsWith("/") ||
        value.startsWith("//") ||
        value.includes("\\")
    ) {
        return "/";
    }

    return value;
}

function GoogleIcon() {
    return (
        <svg viewBox="0 0 48 48" aria-hidden="true">
            <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"
            />
            <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 38.05 46.98 31.93 46.98 24.55Z"
            />
            <path
                fill="#FBBC05"
                d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.88.93 7.56 2.56 10.78l7.97-6.19Z"
            />
            <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.9 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
            />
        </svg>
    );
}

function MailIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect
                x="3"
                y="5"
                width="18"
                height="14"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.7"
            />
            <path
                d="m4 7 8 6 8-6"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function LockIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect
                x="4.5"
                y="10"
                width="15"
                height="11"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.7"
            />
            <path
                d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
            />
        </svg>
    );
}

function EyeIcon({ visible }: { visible: boolean }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M2.5 12s3.4-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.4 6.5-9.5 6.5S2.5 12 2.5 12Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
            />
            <circle
                cx="12"
                cy="12"
                r="3"
                stroke="currentColor"
                strokeWidth="1.7"
            />
            {visible && (
                <path
                    d="M4 4l16 16"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                />
            )}
        </svg>
    );
}

function ArrowIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M4 12h15m-6-6 6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function RankingIcon() {
    return (
        <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <rect x="3" y="19" width="6" height="10" rx="1" stroke="currentColor" strokeWidth="1.8" />
            <rect x="13" y="11" width="6" height="18" rx="1" stroke="currentColor" strokeWidth="1.8" />
            <rect x="23" y="3" width="6" height="26" rx="1" stroke="currentColor" strokeWidth="1.8" />
        </svg>
    );
}

function CalendarIcon() {
    return (
        <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <rect x="3.5" y="6.5" width="25" height="22" rx="2" stroke="currentColor" strokeWidth="1.8" />
            <path d="M10 3v7M22 3v7M4 13h24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M10 18h.1M16 18h.1M22 18h.1M10 23h.1M16 23h.1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
    );
}

function TrophyIcon() {
    return (
        <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path
                d="M10 4h12v7a6 6 0 0 1-12 0V4ZM10 7H4v3a6 6 0 0 0 6 6M22 7h6v3a6 6 0 0 1-6 6M16 17v7m-6 4h12m-9-4h6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function ShieldIcon() {
    return (
        <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path
                d="M16 3 27 7v8c0 7-4.5 11.5-11 14C9.5 26.5 5 22 5 15V7l11-4Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
            />
            <path
                d="m11 16 3.5 3.5L21.5 12"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export default function LoginForm() {
    const searchParams = useSearchParams();

    const supabase = useMemo(() => {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!url || !anonKey) return null;

        return createBrowserClient(url, anonKey);
    }, []);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const nextPath = getSafeNextPath(searchParams.get("next"));
    const authError = searchParams.get("error");

    async function handleEmailLogin(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErrorMessage("");

        if (!supabase) {
            setErrorMessage(
                "No se ha podido conectar con el servicio de acceso. Comprueba la configuración."
            );
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });

            if (error) {
                setErrorMessage(
                    "No se ha podido iniciar sesión. Comprueba tu correo y contraseña."
                );
                return;
            }

            window.location.assign(nextPath);
        } catch {
            setErrorMessage(
                "Ha ocurrido un error de conexión. Inténtalo de nuevo."
            );
        } finally {
            setIsLoading(false);
        }
    }

    async function handleGoogleLogin() {
        setErrorMessage("");

        if (!supabase) {
            setErrorMessage(
                "No se ha podido conectar con el servicio de acceso. Comprueba la configuración."
            );
            return;
        }

        setIsGoogleLoading(true);

        try {
            const callbackUrl = new URL("/auth/callback", window.location.origin);
            callbackUrl.searchParams.set("next", nextPath);

            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: callbackUrl.toString(),
                },
            });

            if (error) {
                setErrorMessage(
                    "No se ha podido conectar con Google. Inténtalo de nuevo."
                );
                setIsGoogleLoading(false);
            }
        } catch {
            setErrorMessage(
                "Ha ocurrido un error al conectar con Google. Inténtalo de nuevo."
            );
            setIsGoogleLoading(false);
        }
    }

    function handleBack() {
        const referrer = document.referrer;

        try {
            if (
                window.history.length > 1 &&
                referrer &&
                new URL(referrer).origin === window.location.origin
            ) {
                window.history.back();
                return;
            }
        } catch {
            // Si el referrer no es válido, se vuelve al inicio.
        }

        window.location.assign("/");
    }

    return (
        <main className={styles.page}>
            <div className={styles.layout}>
                <section className={styles.visual} aria-label="Sagunto Padel Cup">
                    <div className={styles.heroContent}>
                        <h2 className={styles.heroTitle}>
                            <span>Tu circuito.</span>
                            <span className={styles.heroAccent}>Tu pasión.</span>
                        </h2>

                        <p className={styles.heroDescription}>
                            Accede a tu área de jugador y vive
                            <br className={styles.desktopBreak} /> el circuito al completo.
                        </p>

                        <ul className={styles.featureList}>
                            <li>
                                <span className={styles.featureIcon}><RankingIcon /></span>
                                <span>Consulta tu ranking<br />individual</span>
                            </li>
                            <li>
                                <span className={styles.featureIcon}><CalendarIcon /></span>
                                <span>Gestiona tus inscripciones<br />y próximas pruebas</span>
                            </li>
                            <li>
                                <span className={styles.featureIcon}><TrophyIcon /></span>
                                <span>Revisa tus resultados<br />e historial de temporada</span>
                            </li>
                        </ul>
                    </div>
                </section>

                <section className={styles.formSide}>
                    <div className={styles.formCard}>
                        <button
                            className={styles.backButton}
                            type="button"
                            onClick={handleBack}
                            aria-label="Volver a la página anterior"
                        >
                            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path
                                    d="M19 12H5m7 7-7-7 7-7"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            Volver
                        </button>

                        <header className={styles.heading}>
                            <h1>Inicia sesión</h1>
                            <p>
                                Accede a tu área de jugador para gestionar tus inscripciones,
                                consultar tus resultados y seguir tu ranking.
                            </p>
                        </header>

                        {authError === "oauth" && (
                            <div className={styles.errorMessage} role="alert">
                                No se ha podido completar el acceso con Google. Inténtalo de nuevo.
                            </div>
                        )}

                        {errorMessage && (
                            <div className={styles.errorMessage} role="alert">
                                {errorMessage}
                            </div>
                        )}

                        <button
                            className={styles.googleButton}
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={isGoogleLoading || isLoading}
                        >
                            {isGoogleLoading ? (
                                <span className={styles.buttonSpinner} aria-hidden="true" />
                            ) : (
                                <span className={styles.googleIcon}><GoogleIcon /></span>
                            )}
                            <span>
                                {isGoogleLoading ? "Conectando con Google..." : "Continuar con Google"}
                            </span>
                        </button>

                        <div className={styles.separator}>
                            <span>o</span>
                        </div>

                        <form className={styles.form} onSubmit={handleEmailLogin}>
                            <div className={styles.field}>
                                <label htmlFor="login-email">Correo electrónico</label>
                                <div className={styles.inputWithIcon}>
                                    <span className={styles.inputIcon}><MailIcon /></span>
                                    <input
                                        id="login-email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        inputMode="email"
                                        placeholder="tu@email.com"
                                        value={email}
                                        onChange={(event) => setEmail(event.target.value)}
                                        required
                                        disabled={isLoading || isGoogleLoading}
                                    />
                                </div>
                            </div>

                            <div className={styles.field}>
                                <label htmlFor="login-password">Contraseña</label>
                                <div className={styles.inputWithIcon}>
                                    <span className={styles.inputIcon}><LockIcon /></span>
                                    <input
                                        id="login-password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        placeholder="Introduce tu contraseña"
                                        value={password}
                                        onChange={(event) => setPassword(event.target.value)}
                                        required
                                        disabled={isLoading || isGoogleLoading}
                                    />
                                    <button
                                        className={styles.passwordToggle}
                                        type="button"
                                        onClick={() => setShowPassword((current) => !current)}
                                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                    >
                                        <EyeIcon visible={showPassword} />
                                    </button>
                                </div>
                            </div>

                            <div className={styles.formOptions}>
                                <span className={styles.sessionNote}>
                                    La sesión se gestiona de forma segura.
                                </span>
                                <a href="/recuperar-contrasena">¿Has olvidado tu contraseña?</a>
                            </div>

                            <button
                                className={styles.submitButton}
                                type="submit"
                                disabled={isLoading || isGoogleLoading}
                            >
                                <span>{isLoading ? "Iniciando sesión..." : "Iniciar sesión"}</span>
                                {!isLoading && <span className={styles.arrowIcon}><ArrowIcon /></span>}
                                {isLoading && <span className={styles.buttonSpinner} aria-hidden="true" />}
                            </button>
                        </form>

                        <div className={styles.registerSection}>
                            <div className={styles.registerSeparator}>
                                <span>¿Todavía no tienes cuenta?</span>
                            </div>
                            <a className={styles.registerButton} href="/registro">
                                Crear cuenta
                            </a>
                        </div>

                        <div className={styles.securityNote}>
                            <span className={styles.shieldIcon}><ShieldIcon /></span>
                            <p>
                                Acceso privado para jugadores registrados.
                                <br />
                                Tus datos están protegidos y se tratan de forma segura.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
