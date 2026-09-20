import { ArrowUpRight, CheckCircle2, CircleAlert } from "lucide-react";
import Link from "next/link";

import styles from "./PublicBlocks.module.css";

export function PageIntro({
    eyebrow,
    title,
    description,
}: {
    eyebrow: string;
    title: string;
    description?: string;
}) {
    return (
        <section className={styles.intro}>
            <div className={styles.introInner}>
                <p className={styles.eyebrow}>{eyebrow}</p>
                <h1>{title}</h1>

                {description ? (
                    <p className={styles.description}>{description}</p>
                ) : null}
            </div>
        </section>
    );
}

export function EmptyPublic({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div className={styles.state} role="status">
            <div className={styles.stateIcon}>
                <CheckCircle2 size={18} aria-hidden="true" />
            </div>

            <div>
                <h2>{title}</h2>
                <p>{description}</p>
            </div>
        </div>
    );
}

export function ErrorPublic({
    message = "No hemos podido cargar esta información.",
}: {
    message?: string;
}) {
    return (
        <div className={`${styles.state} ${styles.stateError}`} role="alert">
            <div className={styles.stateIcon}>
                <CircleAlert size={18} aria-hidden="true" />
            </div>

            <div>
                <h2>Ha ocurrido un error</h2>
                <p>{message}</p>
            </div>
        </div>
    );
}

export function SectionHeading({
    eyebrow,
    title,
    href,
    label,
}: {
    eyebrow: string;
    title: string;
    href?: string;
    label?: string;
}) {
    return (
        <div className={styles.sectionHeading}>
            <div>
                <p>{eyebrow}</p>
                <h2>{title}</h2>
            </div>

            {href && label ? (
                <Link href={href}>
                    {label}
                    <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
            ) : null}
        </div>
    );
}