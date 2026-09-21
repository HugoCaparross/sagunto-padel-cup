import {
    ArrowUpRight,
    CheckCircle2,
    CircleAlert,
} from "lucide-react";
import Link from "next/link";

import styles from "./PublicBlocks.module.css";

type PageIntroProps = {
    eyebrow: string;
    title: string;
    description?: string;
    children?: React.ReactNode;
};

export function PageIntro({
    eyebrow,
    title,
    description,
    children,
}: PageIntroProps) {
    return (
        <section className={styles.pageIntro}>
            <div className={styles.pageIntroInner}>
                <p className={styles.eyebrow}>
                    {eyebrow}
                </p>

                <h1>{title}</h1>

                {description ? (
                    <p
                        className={
                            styles.pageIntroDescription
                        }
                    >
                        {description}
                    </p>
                ) : null}

                {children ? (
                    <div
                        className={
                            styles.pageIntroActions
                        }
                    >
                        {children}
                    </div>
                ) : null}
            </div>
        </section>
    );
}

type EmptyPublicProps = {
    title: string;
    description: string;
    actionHref?: string;
    actionLabel?: string;
};

export function EmptyPublic({
    title,
    description,
    actionHref,
    actionLabel,
}: EmptyPublicProps) {
    return (
        <div
            className={styles.publicState}
            role="status"
        >
            <div
                className={styles.publicStateIcon}
                aria-hidden="true"
            >
                <CheckCircle2
                    size={20}
                    strokeWidth={2}
                />
            </div>

            <div className={styles.publicStateBody}>
                <p
                    className={
                        styles.publicStateEyebrow
                    }
                >
                    INFORMACIÓN
                </p>

                <h2>{title}</h2>

                <p>{description}</p>

                {actionHref && actionLabel ? (
                    <Link
                        href={actionHref}
                        className={styles.stateAction}
                    >
                        {actionLabel}

                        <ArrowUpRight
                            size={16}
                            aria-hidden="true"
                        />
                    </Link>
                ) : null}
            </div>
        </div>
    );
}

type ErrorPublicProps = {
    message?: string;
    actionHref?: string;
    actionLabel?: string;
};

export function ErrorPublic({
    message = "No hemos podido cargar esta información.",
    actionHref,
    actionLabel = "Volver a intentarlo",
}: ErrorPublicProps) {
    return (
        <div
            className={`${styles.publicState} ${styles.publicStateError}`}
            role="alert"
        >
            <div
                className={styles.publicStateIcon}
                aria-hidden="true"
            >
                <CircleAlert
                    size={20}
                    strokeWidth={2}
                />
            </div>

            <div className={styles.publicStateBody}>
                <p
                    className={
                        styles.publicStateEyebrow
                    }
                >
                    AVISO
                </p>

                <h2>
                    No hemos podido cargar la
                    información
                </h2>

                <p>{message}</p>

                {actionHref ? (
                    <Link
                        href={actionHref}
                        className={styles.stateAction}
                    >
                        {actionLabel}

                        <ArrowUpRight
                            size={16}
                            aria-hidden="true"
                        />
                    </Link>
                ) : null}
            </div>
        </div>
    );
}

type SectionHeadingProps = {
    eyebrow?: string;
    title: string;
    description?: string;
    href?: string;
    label?: string;
};

export function SectionHeading({
    eyebrow,
    title,
    description,
    href,
    label,
}: SectionHeadingProps) {
    return (
        <div className={styles.sectionHeading}>
            <div className={styles.sectionHeadingContent}>
                {eyebrow ? (
                    <p
                        className={
                            styles.sectionEyebrow
                        }
                    >
                        {eyebrow}
                    </p>
                ) : null}

                <h2>{title}</h2>

                {description ? (
                    <p
                        className={
                            styles.sectionDescription
                        }
                    >
                        {description}
                    </p>
                ) : null}
            </div>

            {href && label ? (
                <Link
                    href={href}
                    className={styles.sectionLink}
                >
                    {label}

                    <ArrowUpRight
                        size={16}
                        aria-hidden="true"
                    />
                </Link>
            ) : null}
        </div>
    );
}

type StatProps = {
    value: string | number;
    label: string;
    detail?: string;
};

export function Stat({
    value,
    label,
    detail,
}: StatProps) {
    return (
        <div className={styles.stat}>
            <strong>{value}</strong>

            <span>{label}</span>

            {detail ? (
                <small>{detail}</small>
            ) : null}
        </div>
    );
}