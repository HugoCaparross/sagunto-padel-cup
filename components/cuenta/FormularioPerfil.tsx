"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { actualizarDatosDeportivos } from "@/actions/estadisticas";
import { actualizarPerfil } from "@/actions/perfil";
import { TALLAS } from "@/lib/validadores/auth";

type Props = {
    inicial: {
        nombre: string;
        talla: (typeof TALLAS)[number] | null;
        visibilidadPublica: boolean;
        consentimientoImagen: boolean;
        ladoPista: "derecha" | "izquierda" | "ambos" | null;
        manoHabil: "diestra" | "zurda" | null;
        pala: string;
        otros: string; // una línea por campo: "Campo: valor"
    };
};

const CAMPO = "rounded-md border border-[#D5D9DC] bg-white px-3 py-2 text-sm";

function parseOtros(texto: string): Record<string, string> {
    const salida: Record<string, string> = {};
    for (const linea of texto.split("\n")) {
        const i = linea.indexOf(":");
        if (i < 0) continue;
        const clave = linea.slice(0, i).trim();
        const valor = linea.slice(i + 1).trim();
        if (clave) salida[clave] = valor;
    }
    return salida;
}

export default function FormularioPerfil({ inicial }: Props) {
    const router = useRouter();
    const [pendiente, startTransition] = useTransition();
    const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

    function guardar(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const talla = String(f.get("talla") ?? "");
        const lado = String(f.get("lado") ?? "");
        const mano = String(f.get("mano") ?? "");
        const pala = String(f.get("pala") ?? "").trim();

        setMensaje(null);

        startTransition(async () => {
            const perfil = await actualizarPerfil({
                nombre: String(f.get("nombre") ?? ""),
                tallaCamiseta: talla === "" ? null : (talla as (typeof TALLAS)[number]),
                visibilidadPublica: f.get("visibilidad") === "on",
                consentimientoImagen: f.get("imagen") === "on",
            });
            if (!perfil.ok) {
                setMensaje({ tipo: "error", texto: perfil.error });
                return;
            }

            const deportivos = await actualizarDatosDeportivos({
                ladoPista: lado === "" ? null : (lado as "derecha" | "izquierda" | "ambos"),
                manoHabil: mano === "" ? null : (mano as "diestra" | "zurda"),
                pala: pala === "" ? null : pala,
                otros: parseOtros(String(f.get("otros") ?? "")),
            });
            if (!deportivos.ok) {
                setMensaje({ tipo: "error", texto: deportivos.error });
                return;
            }

            setMensaje({ tipo: "ok", texto: "Cambios guardados" });
            router.refresh();
        });
    }

    return (
        <form onSubmit={guardar} className="space-y-8">
            <fieldset className="grid gap-4 sm:grid-cols-2">
                <legend className="mb-3 text-lg font-semibold">Datos personales</legend>

                <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                    <span className="text-[#68737D]">Nombre y apellidos visibles</span>
                    <input name="nombre" defaultValue={inicial.nombre} required minLength={2} maxLength={80} className={CAMPO} />
                </label>

                <label className="flex flex-col gap-1 text-sm">
                    <span className="text-[#68737D]">Talla de camiseta</span>
                    <select name="talla" defaultValue={inicial.talla ?? ""} className={CAMPO}>
                        <option value="">Sin indicar</option>
                        {TALLAS.map((t) => (
                            <option key={t} value={t}>
                                {t}
                            </option>
                        ))}
                    </select>
                </label>
            </fieldset>

            <fieldset className="space-y-3">
                <legend className="mb-3 text-lg font-semibold">Privacidad y consentimientos</legend>

                <label className="flex items-start gap-2 text-sm">
                    <input name="visibilidad" type="checkbox" defaultChecked={inicial.visibilidadPublica} className="mt-1" />
                    <span>
                        Mostrar mi nombre, foto y resultados en el ranking y en mi perfil público. Si no lo
                        marcas, aparecerás como &quot;Jugador privado&quot;.
                    </span>
                </label>

                <label className="flex items-start gap-2 text-sm">
                    <input name="imagen" type="checkbox" defaultChecked={inicial.consentimientoImagen} className="mt-1" />
                    <span>
                        Autorizo el uso de mi imagen en fotos y vídeos de las pruebas. Puedes retirarlo cuando
                        quieras; el cambio queda registrado.
                    </span>
                </label>
            </fieldset>

            <fieldset className="grid gap-4 sm:grid-cols-2">
                <legend className="mb-3 text-lg font-semibold">Datos deportivos (opcionales)</legend>

                <label className="flex flex-col gap-1 text-sm">
                    <span className="text-[#68737D]">Lado de pista</span>
                    <select name="lado" defaultValue={inicial.ladoPista ?? ""} className={CAMPO}>
                        <option value="">Sin indicar</option>
                        <option value="derecha">Derecha</option>
                        <option value="izquierda">Izquierda</option>
                        <option value="ambos">Ambos</option>
                    </select>
                </label>

                <label className="flex flex-col gap-1 text-sm">
                    <span className="text-[#68737D]">Mano hábil</span>
                    <select name="mano" defaultValue={inicial.manoHabil ?? ""} className={CAMPO}>
                        <option value="">Sin indicar</option>
                        <option value="diestra">Diestra</option>
                        <option value="zurda">Zurda</option>
                    </select>
                </label>

                <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                    <span className="text-[#68737D]">Pala</span>
                    <input name="pala" defaultValue={inicial.pala} maxLength={80} className={CAMPO} />
                </label>

                <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                    <span className="text-[#68737D]">Otros datos (una línea por campo, formato &quot;Campo: valor&quot;, máximo 10)</span>
                    <textarea name="otros" defaultValue={inicial.otros} rows={4} className={CAMPO} />
                </label>
            </fieldset>

            {mensaje && (
                <p
                    className={`rounded-lg p-3 text-sm ${mensaje.tipo === "ok" ? "bg-[#EAF6EF] text-[#16845B]" : "bg-[#FDECEC] text-[#C73535]"
                        }`}
                >
                    {mensaje.texto}
                </p>
            )}

            <button
                type="submit"
                disabled={pendiente}
                className="rounded-lg bg-[#F0443A] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
                {pendiente ? "Guardando…" : "Guardar cambios"}
            </button>
        </form>
    );
}