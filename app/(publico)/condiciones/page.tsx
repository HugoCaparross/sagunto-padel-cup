import type { Metadata } from "next";
import DocumentoLegal from "@/components/legal/DocumentoLegal";

export const metadata: Metadata = { title: "Condiciones de participación" };

export default function PaginaCondiciones() {
    return <DocumentoLegal tipo="condiciones_inscripcion" />;
}