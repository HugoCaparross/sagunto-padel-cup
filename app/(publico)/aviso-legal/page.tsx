import type { Metadata } from "next";
import DocumentoLegal from "@/components/legal/DocumentoLegal";

export const metadata: Metadata = { title: "Aviso legal" };

export default function PaginaAvisoLegal() {
    return <DocumentoLegal tipo="aviso_legal" />;
}