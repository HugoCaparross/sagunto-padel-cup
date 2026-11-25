import Link from "next/link";
import { listarPruebasAdmin } from "@/actions/pruebas";
import { listarInscritos } from "@/actions/inscritos";
import EstadoPrueba from "@/components/pruebas/EstadoPrueba";
import {
    CATEGORIAS,
    ETIQUETAS_CATEGORIA,
    ETIQUETAS_ESTADO_INSCRIPCION,
    type Categoria,
} from "@/lib/constantes";
import { euros, fechaLarga } from "@/lib/formato";

type Props = {
    params: Promise<{ id: string }>;
};

export default async function PaginaPrueba({ params }: Props) {
    const { id } = await params;

    const lista = await listarPruebasAdmin();
    if (!lista.ok) return <p className="p-6 text-[var(--color-danger)]">{lista.error}</p>;

    const prueba = lista.pruebas.find((p) => p.id === id);
    if (!prueba) return <p className="p-6 text-[var(--color-danger)]">Prueba no encontrada</p>;

    const inscritos = await listarInscritos({ pruebaId: id });
    const filas = inscritos.ok ? inscritos.filas : [];

    const porCategoria = (c: Categoria) => filas.filter((f) => f.categoria === c);

    return (
        <main className="space-y-8 p-6">
            <nav className="text-sm text-[var(--color-muted)]">
                <Link href="/admin/pruebas" className="hover:underline">
                    Pruebas
                </Link>
                <span> / {prueba.nombre}</span>
            </nav>

            <header className="space-y-1">
                <h1 className="text-2xl font-semibold">
                    {prueba.nombre}
                    {prueba.esMaster && (
                        <span className="ml-3 rounded bg-[var(--color-warning-bg)] px-2 py-0.5 text-sm text-[var(--color-warning)]">
                            Máster
                        </span>
                    )}
                </h1>
                <p className="text-sm text-[var(--color-muted)]">
                    {fechaLarga(prueba.fechaInicio)}
                    {prueba.fechaFin !== prueba.fechaInicio && ` – ${fechaLarga(prueba.fechaFin)}`}
                    {" · "}
                    {prueba.sede}
                    {" · "}
                    {euros(prueba.precioCentimos)} por pareja (efectivo)
                </p>
            </header>

            <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                <aside className="space-y-4">
                    <EstadoPrueba pruebaId={id} estado={prueba.estado} />

                    <section className="space-y-2 rounded-xl bg-white p-4 ring-1 ring-[var(--color-border)]">
                        <h2 className="font-semibold">Herramientas</h2>
                        <Link
                            href={`/admin/pruebas/${id}/horarios`}
                            className="block rounded-lg bg-[var(--color-surface)] px-3 py-2 text-sm hover:bg-[var(--color-surface-hover)]"
                        >
                            Horarios y pistas
                        </Link>
                        {prueba.categorias.map((c) => (
                            <Link
                                key={c}
                                href={`/admin/pruebas/${id}/cuadros?categoria=${c}`}
                                className="block rounded-lg bg-[var(--color-surface)] px-3 py-2 text-sm hover:bg-[var(--color-surface-hover)]"
                            >
                                Cuadros · {ETIQUETAS_CATEGORIA[c]}
                            </Link>
                        ))}
                    </section>

                    <section className="rounded-xl bg-white p-4 text-sm ring-1 ring-[var(--color-border)]">
                        <p className="text-[var(--color-muted)]">Parejas activas</p>
                        <p className="text-2xl font-semibold">
                            {prueba.ocupadas} / {prueba.plazasMaximas}
                        </p>
                    </section>
                </aside>

                <section className="space-y-6">
                    {CATEGORIAS.filter((c) => prueba.categorias.includes(c)).map((c) => {
                        const lista = porCategoria(c);
                        return (
                            <div key={c} className="rounded-xl bg-white p-4 ring-1 ring-[var(--color-border)]">
                                <h2 className="mb-3 font-semibold">
                                    {ETIQUETAS_CATEGORIA[c]}{" "}
                                    <span className="text-sm font-normal text-[var(--color-muted)]">
                                        ({lista.filter((f) => f.ocupaPlaza).length} activas)
                                    </span>
                                </h2>

                                {lista.length === 0 ? (
                                    <p className="text-sm text-[var(--color-muted)]">Sin inscritos todavía.</p>
                                ) : (
                                    <ul className="divide-y divide-[var(--color-border)] text-sm">
                                        {lista.map((f) => (
                                            <li key={f.inscripcionId} className="flex items-center justify-between py-2">
                                                <span>{f.texto}</span>
                                                <span className="text-xs text-[var(--color-muted)]">
                                                    {f.estado ? ETIQUETAS_ESTADO_INSCRIPCION[f.estado] : ""}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        );
                    })}

                    {CATEGORIAS.filter((c) => prueba.categorias.includes(c)).length === 0 && (
                        <p className="text-sm text-[var(--color-muted)]">Esta prueba no tiene categorías definidas.</p>
                    )}
                </section>
            </div>
        </main>
    );
}