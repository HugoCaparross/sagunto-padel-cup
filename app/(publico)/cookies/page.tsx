import type { Metadata } from "next";
import DocumentoLegal from "@/components/legal/DocumentoLegal";

export const metadata: Metadata = { title: "Política de cookies" };

export default function PaginaCookies() {
    return <DocumentoLegal tipo="cookies" />;
}