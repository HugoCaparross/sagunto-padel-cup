import styles from "./crm.module.css";

const TONE: Record<string, string> = {
    pending: "warning",
    confirmed: "success",
    waitlist: "info",
    cancelled: "neutral",
    rejected: "error",
    active: "success",
    inactive: "neutral",
    suspended: "error",
    retired: "neutral",
};

export function StatusBadge({ value, label }: { value: string; label: string }) {
    return <span className={`${styles.badge} ${styles[TONE[value] ?? "neutral"]}`}>{label}</span>;
}

export function Kpi({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
    return (
        <article className={styles.kpi}>
            <span className={styles.kpiLabel}>{label}</span>
            <strong className={styles.kpiValue}>{value}</strong>
            {hint && <span className={styles.kpiHint}>{hint}</span>}
        </article>
    );
}

export function EmptyState({ title, text }: { title: string; text: string }) {
    return (
        <div className={styles.empty}>
            <strong>{title}</strong>
            <p>{text}</p>
        </div>
    );
}

export function PageHeader({ eyebrow, title, actions }: { eyebrow: string; title: string; actions?: React.ReactNode }) {
    return (
        <header className={styles.pageHeader}>
            <div>
                <p className={styles.eyebrow}>{eyebrow}</p>
                <h1 className={styles.pageTitle}>{title}</h1>
            </div>
            {actions && <div className={styles.headerActions}>{actions}</div>}
        </header>
    );
}