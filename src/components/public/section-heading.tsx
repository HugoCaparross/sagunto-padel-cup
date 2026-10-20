import type { ReactNode } from "react";
import styles from "./section-heading.module.css";

type SectionHeadingProps = {
    title: string;
    eyebrow?: string;
    description?: string;
    action?: ReactNode;
    dark?: boolean;
};

export function SectionHeading({
    title,
    eyebrow,
    description,
    action,
    dark = false,
}: SectionHeadingProps) {
    return (
        <div
            className={`${styles.heading} ${dark ? styles.dark : ""}`}
        >
            <div className={styles.titleGroup}>
                {eyebrow && (
                    <span className={styles.eyebrow}>{eyebrow}</span>
                )}

                <h2>{title}</h2>

                {description && <p>{description}</p>}
            </div>

            {action && <div className={styles.action}>{action}</div>}
        </div>
    );
}