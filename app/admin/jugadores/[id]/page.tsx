import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cargarFichaJugador } from "@/lib/jugadores/admin-datos";
import {
    ETIQUETAS_CATEGORIA,
    ETIQUETAS_CUADRO,
    ETIQUETAS_ESTADO_INSCRIPCION,
    ETIQUETAS_RONDA,
} from "@/lib/constantes";
import { fechaCorta, fechaLarga } from "@/lib/formato";

export const metadata: Metadata = { title: "Jugador · Admin" };

type Props = { params: Promise<{ id: string }> };

const ETIQUETA_CONSENTIMIENTO: Record<string, string> = {
    privacidad: "Política de privacidad",
    imagen: "Uso de imagen",
    mayoria_o_tutor: "Mayoría de edad o autorización de tutor",
    cookies_analitica: "Cookies de analítica",
    comunicaciones: "Comunicaciones",
};

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
    return (
        <section className="space-y-3 rounded-xl bg-white p-5 ring-1 ring-[var(--color-border)]">
            <h2 className="font-semibold">{titulo}</h2>
            {children}
        </section>
    );
}

export default async function PaginaFichaJugador({ params }: Props) {
    const { id } = await params;
    const ficha = await cargarFichaJugador(id);
    if (!ficha) notFound();

    const { perfil, nivel, estadisticas } = ficha;
    const datos = perfil.datosDeportivos
        ? Object.entries(perfil.datosDeportivos).flatMap(([clave, valor]) => {
            if (clave === "otros" && valor && typeof valor === "object") {
                return Object.entries(valor as Record<string, string>);
            }
            if (valor === null || valor === "" || typeof valor === "object") return [];
            return [[clave, String(valor)] as [string, string]];
        })
        : [];

    return (
        <main className="space-y-6">
            <nav className="text-sm text-[var(--color-muted)]">
                <Link href="/admin/jugadores" className="hover:underline">
                    Jugadores
                </Link>
                <span> / {perfil.nombre}</span>
            </nav>

            <header className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold">{perfil.nombre}</h1>
                    <p className="text-sm text-[var(--color-muted)]">
                        {perfil.email ?? "Sin email"} · alta el {fechaLarga(perfil.creadoAt)}
                    </p>
                </div>
                <div className="flex gap-2 text-xs">
                    {perfil.rol === "organizador" && (
                        <span className="rounded bg-[var(--color-navy)] px-2 py-1 text-white">Organizador</span>
                    )}
                    <span
                        className={`rounded px-2 py-1 ${perfil.onboardingAt ? "bg-[var(--color-success-bg)] text-[var(--color-success)]" : "bg-[var(--color-warning-bg)] text-[var(--color-warning)]"
                            }`}
                    >
                        {perfil.onboardingAt ? "Perfil completo" : "Perfil sin completar"}
                    </span>
                    <span className="rounded bg-[var(--color-surface)] px-2 py-1 text-[var(--color-muted)]">
                        {perfil.visible ? "Perfil público" : "Perfil privado"}
                    </span>
                </div>
            </header>

            <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                <aside className="space-y-6">
                    <Bloque titulo="Nivel">
                        <p className="text-3xl font-semibold">Nivel {nivel.nivel}</p>
                        <p className="text-sm text-[var(--color-muted)]">{nivel.tier}</p>
                        <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface)]">
                            <div
                                className="h-full rounded-full bg-[var(--color-sage)]"
                                style={{ width: `${Math.round(nivel.progreso * 100)}%` }}
                            />
                        </div>
                        <dl className="grid grid-cols-2 gap-2 text-sm">
                            <dt className="text-[var(--color-muted)]">Puntos</dt>
                            <dd className="text-right">{estadisticas.puntosHistoricos}</dd>
                            <dt className="text-[var(--color-muted)]">Pruebas</dt>
                            <dd className="text-right">{estadisticas.pruebasJugadas}</dd>
                            <dt className="text-[var(--color-muted)]">Partidos</dt>
                            <dd className="text-right">{estadisticas.partidos}</dd>
                            <dt className="text-[var(--color-muted)]">% victorias</dt>
                            <dd className="text-right">{estadisticas.porcentajeVictorias}%</dd>
                            <dt className="text-[var(--color-muted)]">Sets</dt>
                            <dd className="text-right">
                                {estadisticas.setsGanados} / {estadisticas.setsPerdidos}
                            </dd>
                        </dl>
                    </Bloque>

                    <Bloque titulo="Datos del perfil">
                        <dl className="grid grid-cols-2 gap-2 text-sm">
                            <dt className="text-[var(--color-muted)]">Talla</dt>
                            <dd className="text-right">{perfil.talla ?? "—"}</dd>
                            <dt className="text-[var(--color-muted)]">Imagen</dt>
                            <dd className="text-right">{perfil.consentimientoImagen ? "Autorizada" : "No autorizada"}</dd>
                        </dl>
                    </Bloque>

                    <Bloque titulo="Datos deportivos">
                        {datos.length === 0 ? (
                            <p className="text-sm text-[var(--color-muted)]">El jugador no ha rellenado estos datos.</p>
                        ) : (
                            <dl className="grid grid-cols-2 gap-2 text-sm">
                                {datos.map(([clave, valor]) => (
                                    <div key={clave} className="contents">
                                        <dt className="text-[var(--color-muted)]">{clave}</dt>
                                        <dd className="text-right">{valor}</dd>
                                    </div>
                                ))}
                            </dl>
                        )}
                    </Bloque>
                </aside>

                <div className="space-y-6">
                    <Bloque titulo="Inscripciones">
                        {ficha.inscripciones.length === 0 ? (
                            <p className="text-sm text-[var(--color-muted)]">Sin inscripciones.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-left text-xs uppercase text-[var(--color-muted)]">
                                        <tr>
                                            <th className="py-2">Prueba</th>
                                            <th className="py-2">Categoría</th>
                                            <th className="py-2">Compañero/a</th>
                                            <th className="py-2">Estado</th>
                                            <th className="py-2">Llegada</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ficha.inscripciones.map((i) => (
                                            <tr key={i.id} className="border-t border-[var(--color-border)]">
                                                <td className="py-2">
                                                    <Link href={`/admin/pruebas/${i.pruebaId}`} className="hover:underline">
                                                        {i.prueba}
                                                    </Link>
                                                </td>
                                                <td className="py-2">{ETIQUETAS_CATEGORIA[i.categoria]}</td>
                                                <td className="py-2">{i.companero ?? "Sin pareja"}</td>
                                                <td className="py-2">{ETIQUETAS_ESTADO_INSCRIPCION[i.estado]}</td>
                                                <td className="py-2">{i.checkinAt ? fechaCorta(i.checkinAt) : "—"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Bloque>

                    <Bloque titulo="Puntos obtenidos">
                        {ficha.puntos.length === 0 ? (
                            <p className="text-sm text-[var(--color-muted)]">Sin puntos publicados.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-left text-xs uppercase text-[var(--color-muted)]">
                                        <tr>
                                            <th className="py-2">Prueba</th>
                                            <th className="py-2">Fecha</th>
                                            <th className="py-2">Categoría</th>
                                            <th className="py-2">Cuadro</th>
                                            <th className="py-2">Resultado</th>
                                            <th className="py-2 text-right">Puntos</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ficha.puntos.map((p, i) => (
                                            <tr key={i} className="border-t border-[var(--color-border)]">
                                                <td className="py-2">{p.prueba}</td>
                                                <td className="py-2">{fechaCorta(p.fecha)}</td>
                                                <td className="py-2">{ETIQUETAS_CATEGORIA[p.categoria]}</td>
                                                <td className="py-2">{ETIQUETAS_CUADRO[p.cuadro]}</td>
                                                <td className="py-2">{ETIQUETAS_RONDA[p.ronda]}</td>
                                                <td className="py-2 text-right font-medium">{p.puntos}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Bloque>

                    <Bloque titulo="Consentimientos">
                        {ficha.consentimientos.length === 0 ? (
                            <p className="text-sm text-[var(--color-muted)]">Sin registros.</p>
                        ) : (
                            <ul className="divide-y divide-[var(--color-border)] text-sm">
                                {ficha.consentimientos.map((c) => (
                                    <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                                        <span>
                                            {ETIQUETA_CONSENTIMIENTO[c.tipo] ?? c.tipo}:{" "}
                                            <span className={c.concedido ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}>
                                                {c.concedido ? "aceptado" : "retirado"}
                                            </span>
                                            {c.titulo && (
                                                <span className="text-[var(--color-muted)]">
                                                    {" "}· {c.titulo}, versión {c.version}
                                                </span>
                                            )}
                                        </span>
                                        <span className="text-xs text-[var(--color-muted)]">{fechaCorta(c.registradoAt)}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Bloque>
                </div>
            </div>
        </main>
    );
}