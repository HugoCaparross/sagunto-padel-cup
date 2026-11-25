"use client";

import Link from "next/link";
import Boton from "@/components/ui/Boton";
import CabeceraPagina from "@/components/ui/CabeceraPagina";

export default function ErrorPagina({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return <main>
        <CabeceraPagina
            eyebrow="Ha ocurrido un problema"
            titulo="No hemos podido cargar esta página"
            descripcion="Puede ser un fallo temporal. Inténtalo de nuevo o vuelve al inicio."
            acciones={<><Boton onClick={reset}>Reintentar</Boton><Boton asChild variante="secundario"><Link href="/">Volver al inicio</Link></Boton></>}
        />
    </main>;
}
