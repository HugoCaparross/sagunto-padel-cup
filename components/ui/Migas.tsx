import Link from "next/link";

type Item = { href?: string; texto: string };
export default function Migas({ items }: { items: Item[] }) {
    return <nav aria-label="Migas de pan" className="container py-3 text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-2">
            <li><Link href="/" className="underline decoration-coral-texto underline-offset-2">Inicio</Link></li>
            {items.map((item, index) => <li key={`${item.texto}-${index}`} className="inline-flex items-center gap-2">
                <span aria-hidden="true">/</span>{item.href && index < items.length - 1 ? <Link href={item.href} className="underline decoration-coral-texto underline-offset-2">{item.texto}</Link> : <span aria-current="page">{item.texto}</span>}
            </li>)}
        </ol>
    </nav>;
}
