"use client";

import Boton from "@/components/ui/Boton";

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
                <p className="rounded-lg bg-[var(--color-success-bg)] p-3 text-sm text-[var(--color-success)]">
                    Llegada registrada a las{" "}
                    {new Date(ficha.checkinAt).toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Europe/Madrid",
                    })}
                </p>
            ) : ficha.motivoBloqueo ? (
                <p className="rounded-lg bg-[var(--color-warning-bg)] p-3 text-sm text-[var(--color-warning)]">
                    {ficha.motivoBloqueo}
                </p>
            ) : null}

            <div className="flex flex-col gap-2">
                <Boton variante="primario" tamano="lg"
                    type="button"
                    onClick={fichar}
                    disabled={enviando || !ficha.puedeRegistrar}
                    className="font-medium disabled:opacity-50"
                >
                    Registrar llegada
                </Boton>

                {ficha.puedePagar && (
                    <button
                        type="button"
                        onClick={marcarPago}
                        disabled={enviando}
                        className="rounded-lg bg-white px-4 py-3 font-medium ring-1 ring-[var(--color-border)] disabled:opacity-50"
                    >
                        Marcar pago en efectivo
                    </button>
                )}
            </div>

            {mensaje && (
                <div
                    className={`rounded-lg p-3 text-sm ${mensaje.tipo === "ok"
                            ? "bg-[var(--color-success-bg)] text-[var(--color-success)]"
                            : "bg-[var(--color-danger-bg)] text-[var(--color-danger)]"
                        }`}
                >
                    {mensaje.texto}
                </div>
            )}
        </section>
    );
}