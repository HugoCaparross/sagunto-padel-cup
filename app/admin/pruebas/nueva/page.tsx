import Link from "next/link";
import FormularioPrueba from "@/components/pruebas/FormularioPrueba";

export default function PaginaNuevaPrueba() {
    return (
        <main className="space-y-6 p-6">
            <nav className="text-sm text-[#68737D]">
                <Link href="/admin/pruebas" className="hover:underline">
                    Pruebas
                </Link>
                <span> / Nueva</span>
            </nav>
            <h1 className="text-2xl font-semibold">Nueva prueba</h1>
            <FormularioPrueba />
        </main>
    );
}