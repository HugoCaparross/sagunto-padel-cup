"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { registrarCheckin, type FichaCheckin } from "@/actions/checkin";
import { marcarPagadaEnPrueba } from "@/actions/inscritos";

type Props = {
    token: string;
    ficha: FichaCheckin;
};

export default function BotonCheckin({ token, ficha }: Props) {
    const router = useRouter();
    const [enviando, startTransition] = useTransition();
    const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(
        null
    );

    function fichar() {
        startTransition(async () => {
            const res = await registrarCheckin({ token });
            if (res.ok) {
                setMensaje({
                    tipo: "ok",
                    texto: res.yaRegistrado ? "Esta pareja ya estaba registrada" : "Llegada registrada",
                });
                router.refresh();
            } else {
                setMensaje({ tipo: "error", texto: res.error });
            }
        });
    }

    function marcarPago() {
        startTransition(async () => {
            const res = await marcarPagadaEnPrueba({ inscripcionId: ficha.inscripcionId });
            if (res.ok) {
                setMensaje({ tipo: "ok", texto: "Pago en efectivo registrado" });
                router.refresh();
            } else {
                setMensaje({ tipo: "error", texto: res.error });
            }
        });
    }

    return (
        <section className="space-y-4">
            {ficha.checkinAt ? (
                <p className="rounded-lg bg-[#EAF6EF] p-3 text-sm text-[#16845B]">
                    Llegada registrada a las{" "}
                    {new Date(ficha.checkinAt).toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Europe/Madrid",
                    })}
                </p>
            ) : ficha.motivoBloqueo ? (
                <p className="rounded-lg bg-[#FFF4DE] p-3 text-sm text-[#B77912]">
                    {ficha.motivoBloqueo}
                </p>
            ) : null}

            <div className="flex flex-col gap-2">
                <button
                    type="button"
                    onClick={fichar}
                    disabled={enviando || !ficha.puedeRegistrar}
                    className="rounded-lg bg-[#F0443A] px-4 py-3 font-medium text-white disabled:opacity-50"
                >
                    Registrar llegada
                </button>

                {ficha.puedePagar && (
                    <button
                        type="button"
                        onClick={marcarPago}
                        disabled={enviando}
                        className="rounded-lg bg-white px-4 py-3 font-medium ring-1 ring-[#D5D9DC] disabled:opacity-50"
                    >
                        Marcar pago en efectivo
                    </button>
                )}
            </div>

            {mensaje && (
                <div
                    className={`rounded-lg p-3 text-sm ${mensaje.tipo === "ok"
                            ? "bg-[#EAF6EF] text-[#16845B]"
                            : "bg-[#FDECEC] text-[#C73535]"
                        }`}
                >
                    {mensaje.texto}
                </div>
            )}
        </section>
    );
}