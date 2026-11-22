"use client";

import Image from "next/image";
import { useRef, useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import GoogleIcon from "@/components/ui/GoogleIcon";

type Props = {
    inicialUrl: string | null;
    perfilPublico: boolean;
};

type RespuestaFoto = {
    fotoUrl?: string;
    aviso?: string | null;
    error?: string;
};

const TIPOS_VALIDOS = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

export default function FotoPerfil({ inicialUrl, perfilPublico }: Props) {
    const router = useRouter();
    const archivoRef = useRef<HTMLInputElement>(null);
    const [fotoLocal, setFotoLocal] = useState({ origen: inicialUrl, url: inicialUrl });
    const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
    const [pendiente, startTransition] = useTransition();
    const fotoUrl = fotoLocal.origen === inicialUrl ? fotoLocal.url : inicialUrl;

    function subir(evento: ChangeEvent<HTMLInputElement>) {
        const archivo = evento.currentTarget.files?.[0];
        evento.currentTarget.value = "";
        if (!archivo) return;

        if (!TIPOS_VALIDOS.includes(archivo.type)) {
            setMensaje({ tipo: "error", texto: "Usa una foto JPG, PNG o WebP." });
            return;
        }
        if (archivo.size > MAX_BYTES) {
            setMensaje({ tipo: "error", texto: "La foto no puede superar los 5 MB." });
            return;
        }

        setMensaje(null);
        const datos = new FormData();
        datos.set("foto", archivo);

        startTransition(async () => {
            try {
                const respuesta = await fetch("/api/perfil/foto", { method: "POST", body: datos });
                const resultado = (await respuesta.json()) as RespuestaFoto;
                if (!respuesta.ok || !resultado.fotoUrl) {
                    setMensaje({
                        tipo: "error",
                        texto: resultado.error ?? "No se pudo actualizar la foto.",
                    });
                    return;
                }

                setFotoLocal({ origen: inicialUrl, url: resultado.fotoUrl });
                setMensaje(
                    resultado.aviso
                        ? { tipo: "error", texto: resultado.aviso }
                        : { tipo: "ok", texto: "Foto de perfil actualizada." }
                );
                router.refresh();
            } catch {
                setMensaje({ tipo: "error", texto: "No se pudo conectar para subir la foto." });
            }
        });
    }

    function quitar() {
        if (!window.confirm("¿Quieres quitar tu foto de perfil?")) return;
        setMensaje(null);
        startTransition(async () => {
            try {
                const respuesta = await fetch("/api/perfil/foto", { method: "DELETE" });
                const resultado = (await respuesta.json()) as RespuestaFoto;
                if (!respuesta.ok) {
                    setMensaje({
                        tipo: "error",
                        texto: resultado.error ?? "No se pudo retirar la foto.",
                    });
                    return;
                }

                setFotoLocal({ origen: inicialUrl, url: null });
                setMensaje(
                    resultado.aviso
                        ? { tipo: "error", texto: resultado.aviso }
                        : { tipo: "ok", texto: "Foto de perfil retirada." }
                );
                router.refresh();
            } catch {
                setMensaje({ tipo: "error", texto: "No se pudo conectar para retirar la foto." });
            }
        });
    }

    return (
        <section className="card grid items-center gap-5 p-5 sm:grid-cols-[6rem_minmax(0,1fr)_auto]">
            <div className="relative grid size-24 place-items-center overflow-hidden rounded-full bg-[#FBEAEC] text-[#C6202B]">
                {fotoUrl ? (
                    <Image src={fotoUrl} alt="Foto de perfil" fill unoptimized sizes="96px" />
                ) : (
                    <GoogleIcon name="person" className="text-4xl" />
                )}
            </div>

            <div className="grid gap-1">
                <h2 className="font-semibold">Foto de perfil</h2>
                <p className="text-sm text-muted">
                    Aparecerá junto a tu nombre en el ranking cuando tu perfil sea público.
                    JPG, PNG o WebP, hasta 5 MB.
                </p>
                {!perfilPublico && (
                    <p className="text-sm font-medium text-[#C6202B]">
                        Activa y guarda la visibilidad pública para subir una foto.
                    </p>
                )}
            </div>

            <div className="flex flex-wrap gap-2 sm:justify-end">
                <label className="btn btn-primario cursor-pointer">
                    <GoogleIcon name="upload" />
                    {pendiente ? "Actualizando…" : fotoUrl ? "Cambiar foto" : "Subir foto"}
                    <input
                        ref={archivoRef}
                        type="file"
                        accept={TIPOS_VALIDOS.join(",")}
                        className="sr-only"
                        disabled={pendiente || !perfilPublico}
                        onChange={subir}
                    />
                </label>
                {fotoUrl && (
                    <button
                        type="button"
                        className="btn btn-fantasma"
                        disabled={pendiente}
                        onClick={quitar}
                    >
                        Quitar
                    </button>
                )}
            </div>

            {mensaje && (
                <p
                    role="status"
                    className={`text-sm sm:col-span-3 ${
                        mensaje.tipo === "ok" ? "text-success" : "text-danger"
                    }`}
                >
                    {mensaje.texto}
                </p>
            )}
        </section>
    );
}
