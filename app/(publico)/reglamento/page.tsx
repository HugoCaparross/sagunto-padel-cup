import type { Metadata } from "next";
import DocumentoLegal from "@/components/legal/DocumentoLegal";

export const metadata: Metadata = { title: "Reglamento del circuito" };

export default function PaginaReglamento() {
    return <DocumentoLegal tipo="reglamento" />;
}