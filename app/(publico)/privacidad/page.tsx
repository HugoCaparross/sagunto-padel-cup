import type { Metadata } from "next";
import DocumentoLegal from "@/components/legal/DocumentoLegal";

export const metadata: Metadata = { title: "Política de privacidad" };

export default function PaginaPrivacidad() {
    return <DocumentoLegal tipo="privacidad" />;
}