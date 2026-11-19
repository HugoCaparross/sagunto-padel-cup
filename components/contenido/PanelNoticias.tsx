"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    cambiarPublicacion,
    eliminarNoticia,
    type NoticiaAdmin,
} from "@/actions/noticias";
import { fechaCorta } from "@/lib/formato";
import { ETIQUETAS_NOTICIA } from "@/lib/validadores/noticias";

type Mensaje = { tipo: "ok" | "error"; texto: string } | null;

export default function PanelNoticias({ noticias }: { noticias: NoticiaAdmin[] }) {
    const router = useRouter();
    const [pendiente, startTransition] = useTransition();
    const [mensaje, setMensaje] = useState<Mensaje>(null);

    function alternarPublicacion(n: NoticiaAdmin) {
        setMensaje(null);
        startTransition(async () => {
            const res = await cambiarPublicacion({ id: n.id, publicada: !n.publicada });
            if (res.ok) {
                setMensaje({
                    tipo: "ok",
                    texto: n.publicada ? `"${n.titulo}" vuelve a borrador` : `"${n.titulo}" publicada`,
                });
                router.refresh();
            } else {
                setMensaje({ tipo: "error", texto: res.error });
            }
        });
    }

    function eliminar(n: NoticiaAdmin) {
        const motivo = window.prompt(
            `Motivo para eliminar "${n.titulo}" (mínimo 10 caracteres). Queda registrado en auditoría:`
        );
        if (!motivo) return;

        setMensaje(null);
        startTransition(async () => {
            const res = await eliminarNoticia({ id: n.id, motivo });
            if (res.ok) {
                setMensaje({ tipo: "ok", texto: `"${n.titulo}" eliminada` });
                router.refresh();
            } else {
                setMensaje({ tipo: "error", texto: res.error });
            }
        });
    }

    if (noticias.length === 0) {
        return (
            <p className="rounded-xl bg-white p-6 text-sm text-[#68737D] ring-1 ring-[#D5D9DC]">
                Todavía no hay noticias. Crea la primera.
            </p>
        );
    }

    return (
        <div className="space-y-4">
            {mensaje && (
                <p
                    className={`rounded-lg p-3 text-sm ${mensaje.tipo === "ok" ? "bg-[#EAF6EF] text-[#16845B]" : "bg-[#FDECEC] text-[#C73535]"
                        }`}
                >
                    {mensaje.texto}
                </p>
            )}

            <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-[#D5D9DC]">
                <table className="w-full text-sm">
                    <thead className="bg-[#F4F5F4] text-left text-xs uppercase text-[#68737D]">
                        <tr>
                            <th className="px-4 py-2">Título</th>
                            <th className="px-4 py-2">Categoría</th>
                            <th className="px-4 py-2">Estado</th>
                            <th className="px-4 py-2">Última edición</th>
                            <th className="px-4 py-2 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {noticias.map((n) => (
                            <tr key={n.id} className="border-t border-[#D5D9DC]">
                                <td className="px-4 py-2">
                                    <p className="font-medium">{n.titulo}</p>
                                    <p className="text-xs text-[#68737D]">/noticias/{n.slug}</p>
                                </td>
                                <td className="px-4 py-2">{ETIQUETAS_NOTICIA[n.categoria]}</td>
                                <td className="px-4 py-2">
                                    <span
                                        className={`rounded px-2 py-0.5 text-xs ${n.publicada ? "bg-[#EAF6EF] text-[#16845B]" : "bg-[#F4F5F4] text-[#68737D]"
                                            }`}
                                    >
                                        {n.publicada ? "Publicada" : "Borrador"}
                                    </span>
                                </td>
                                <td className="px-4 py-2">{fechaCorta(n.actualizadaAt)}</td>
                                <td className="px-4 py-2">
                                    <div className="flex justify-end gap-3">
                                        <Link href={`/admin/contenido/${n.id}`} className="underline">
                                            Editar
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => alternarPublicacion(n)}
                                            disabled={pendiente}
                                            className="underline disabled:opacity-50"
                                        >
                                            {n.publicada ? "Pasar a borrador" : "Publicar"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => eliminar(n)}
                                            disabled={pendiente}
                                            className="text-[#C73535] underline disabled:opacity-50"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}