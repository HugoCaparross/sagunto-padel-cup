import Link from "next/link";
import Boton from "@/components/ui/Boton";
import CabeceraPagina from "@/components/ui/CabeceraPagina";

export default function NotFound() {
    return <main>
        <CabeceraPagina
            eyebrow="Error 404"
            titulo="Página no encontrada"
            descripcion="La dirección no existe o ha cambiado. Puedes continuar desde una de estas secciones."
            acciones={<><Boton asChild><Link href="/calendario">Calendario</Link></Boton><Boton asChild variante="secundario"><Link href="/ranking">Ranking</Link></Boton><Boton asChild variante="fantasma"><Link href="/contacto">Contacto</Link></Boton></>}
        />
    </main>;
}
