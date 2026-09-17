import Link from "next/link";
import styles from "./PublicBlocks.module.css";

export function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
    return <section className={styles.intro}><p>{eyebrow}</p><h1>{title}</h1>{description && <div className={styles.description}>{description}</div>}</section>;
}

export function EmptyPublic({ title, description }: { title: string; description: string }) {
    return <div className={styles.empty}><h2>{title}</h2><p>{description}</p></div>;
}

export function ErrorPublic({ message = "No hemos podido cargar esta información." }: { message?: string }) {
    return <div className={styles.empty}><h2>Ha ocurrido un error</h2><p>{message}</p></div>;
}

export function SectionHeading({ eyebrow, title, href, label }: { eyebrow: string; title: string; href?: string; label?: string }) {
    return <div className={styles.sectionHeading}><div><p>{eyebrow}</p><h2>{title}</h2></div>{href && label && <Link href={href}>{label} →</Link>}</div>;
}
