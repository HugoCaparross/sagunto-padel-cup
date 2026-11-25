"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { cambiarRol } from "@/actions/ajustes";

type Persona = { id: string; nombre: string; email: string | null };

type Props = {
    organizadores: Persona[];
    jugadores: Persona[];
    usuarioId: string;
};

export default function GestionRoles({ organizadores, jugadores, usuarioId }: Props) {
    const router = useRouter();
    const [pendiente, startTransition] = useTransition();
    const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

    function ejecutar(perfilId: string, rol: "jugador" | "organizador", motivo: string) {
        setMensaje(null);
        startTransition(async () => {
            const res = await cambiarRol({ perfilId, rol, motivo });
            if (res.ok) {
                setMensaje({ tipo: "ok", texto: rol === "organizador" ? "Organizador añadido" : "Rol retirado" });
                router.refresh();
            } else {
                setMensaje({ tipo: "error", texto: res.error });
            }
        });
    }

    function quitar(p: Persona) {
        if (p.id === usuarioId) return;
        const motivo = window.prompt(`Motivo para quitar el rol de organizador a ${p.nombre} (mínimo 10 caracteres):`);
        if (!motivo) return;
        ejecutar(p.id, "jugador", motivo);
    }

    function anadir(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const perfilId = String(f.get("perfil") ?? "");
        const motivo = String(f.get("motivo") ?? "");
        if (!perfilId) return;
        ejecutar(perfilId, "organizador", motivo);
        e.currentTarget.reset();
    }

    return (
        <div className="space-y-6">
            <div className="card overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-surface text-left text-sm uppercase text-muted">
                        <tr>
                            <th className="px-4 py-2">Organizador</th>
                            <th className="px-4 py-2">Email</th>
                            <th className="px-4 py-2 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {organizadores.map((o) => (
                            <tr key={o.id} className="border-t border-border">
                                <td className="px-4 py-2">
                                    {o.nombre}
                                    {o.id === usuarioId && <span className="ml-2 badge badge-marca">Tú</span>}
                                </td>
                                <td className="px-4 py-2 text-muted">{o.email ?? "—"}</td>
                                <td className="px-4 py-2 text-right">
                                    {o.id === usuarioId ? (
                                        <span className="text-sm text-muted">No puedes quitarte el rol</span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => quitar(o)}
                                            disabled={pendiente}
                                            className="text-danger underline disabled:opacity-50"
                                        >
                                            Quitar rol
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <form onSubmit={anadir} className="card grid gap-3 p-4 text-sm md:grid-cols-[1fr_1fr_auto] md:items-end">
                <label className="flex flex-col gap-1">
                    <span className="text-muted">Jugador</span>
                    <select name="perfil" required defaultValue="" className="rounded-md border border-border bg-white px-2 py-1.5">
                        <option value="" disabled>Elige un jugador</option>
                        {jugadores.map((j) => (
                            <option key={j.id} value={j.id}>
                                {j.nombre}{j.email ? ` · ${j.email}` : ""}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="flex flex-col gap-1">
                    <span className="text-muted">Motivo (mínimo 10 caracteres)</span>
                    <input name="motivo" required minLength={10} maxLength={500} className="rounded-md border border-border bg-white px-2 py-1.5" />
                </label>
                <button type="submit" disabled={pendiente} className="btn btn-primario">
                    Hacer organizador
                </button>
            </form>

            {mensaje && (
                <p className={`alerta ${mensaje.tipo === "ok" ? "alerta-exito" : "alerta-error"}`}>{mensaje.texto}</p>
            )}
        </div>
    );
}