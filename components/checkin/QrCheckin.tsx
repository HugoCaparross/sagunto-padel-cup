"use client";

import { QRCodeSVG } from "qrcode.react";

type Props = {
    url: string;
    llegadaAt: string | null;
};

// El jugador enseña este código al llegar. Lo escanea el organizador.
export default function QrCheckin({ url, llegadaAt }: Props) {
    if (llegadaAt) {
        return (
            <p className="rounded-lg bg-[var(--color-success-bg)] p-3 text-sm text-[var(--color-success)]">
                Ya has llegado a la prueba
            </p>
        );
    }

    return (
        <div className="flex flex-col items-center gap-2 rounded-xl bg-white p-4 ring-1 ring-[var(--color-border)]">
            <QRCodeSVG value={url} size={220} level="M" />
            <p className="text-xs text-[var(--color-muted)]">Enseña este código al llegar a la prueba</p>
        </div>
    );
}