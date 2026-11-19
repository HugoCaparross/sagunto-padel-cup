"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { crearPrueba } from "@/actions/pruebas";
import { CATEGORIAS, ETIQUETAS_CATEGORIA, type Categoria } from "@/lib/constantes";

export default function FormularioPrueba() {
    const router = useRouter();
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [categorias, setCategorias] = useState<Categoria[]>([...CATEGORIAS]);

    function alternar(c: Categoria) {
        setCategorias((prev) =>
            prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
        );
    }

    async function enviar(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const f = new FormData(e.currentTarget);

        const euros = Number(String(f.get("precio") ?? "").replace(",", "."));
        const slug = String(f.get("slug") ?? "").trim();
        const sedeUrl = String(f.get("sedeUrl") ?? "").trim();

        setEnviando(true);
        setError(null);

        const res = await crearPrueba({
            nombre: String(f.get("nombre") ?? ""),
            slug: slug || undefined,
            fechaInicio: String(f.get("fechaInicio") ?? ""),
            fechaFin: String(f.get("fechaFin") ?? ""),
            horaInicio: String(f.get("horaInicio") ?? ""),
            horaFin: String(f.get("horaFin") ?? ""),
            sede: String(f.get("sede") ?? ""),
            sedeUrl: sedeUrl || null,
            precioCentimos: Math.round(euros * 100),
            esMaster: f.get("esMaster") === "on",
            categorias,
            plazasMaximas: Number(f.get("plazas")),
        });

        setEnviando(false);

        if (res.ok) {
            router.push(`/admin/pruebas/${res.id}`);
        } else {
            setError(res.error);
        }
    }

    const campo = "rounded-md border border-[#D5D9DC] bg-white px-2 py-1.5 text-sm";

    return (
        <form onSubmit={enviar} className="max-w-2xl space-y-6 rounded-xl bg-white p-6 ring-1 ring-[#D5D9DC]">
            <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                    <span className="text-[#68737D]">Nombre</span>
                    <input name="nombre" required minLength={3} maxLength={80} className={campo} placeholder="Prueba 3" />
                </label>

                <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                    <span className="text-[#68737D]">Slug (opcional, se genera del nombre)</span>
                    <input name="slug" maxLength={80} className={campo} placeholder="prueba-3-2027" />
                </label>

                <label className="flex flex-col gap-1 text-sm">
                    <span className="text-[#68737D]">Fecha de inicio</span>
                    <input name="fechaInicio" type="date" required className={campo} />
                </label>

                <label className="flex flex-col gap-1 text-sm">
                    <span className="text-[#68737D]">Fecha de fin</span>
                    <input name="fechaFin" type="date" required className={campo} />
                </label>

                <label className="flex flex-col gap-1 text-sm">
                    <span className="text-[#68737D]">Hora de inicio</span>
                    <input name="horaInicio" type="time" defaultValue="09:00" required className={campo} />
                </label>

                <label className="flex flex-col gap-1 text-sm">
                    <span className="text-[#68737D]">Hora de fin</span>
                    <input name="horaFin" type="time" defaultValue="13:00" required className={campo} />
                </label>

                <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                    <span className="text-[#68737D]">Sede</span>
                    <input name="sede" required className={campo} placeholder="Polideportivo René Marigil" />
                </label>

                <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                    <span className="text-[#68737D]">Enlace al mapa (opcional)</span>
                    <input name="sedeUrl" type="url" className={campo} placeholder="https://maps.google.com/..." />
                </label>

                <label className="flex flex-col gap-1 text-sm">
                    <span className="text-[#68737D]">Precio por pareja (€, se paga en efectivo)</span>
                    <input name="precio" inputMode="decimal" required className={campo} placeholder="25" />
                </label>

                <label className="flex flex-col gap-1 text-sm">
                    <span className="text-[#68737D]">Parejas máximas</span>
                    <input name="plazas" type="number" min={3} max={200} defaultValue={24} required className={campo} />
                </label>
            </div>

            <fieldset className="space-y-2">
                <legend className="text-sm text-[#68737D]">Categorías</legend>
                <div className="flex flex-wrap gap-3">
                    {CATEGORIAS.map((c) => (
                        <label key={c} className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={categorias.includes(c)}
                                onChange={() => alternar(c)}
                            />
                            {ETIQUETAS_CATEGORIA[c]}
                        </label>
                    ))}
                </div>
            </fieldset>

            <label className="flex items-center gap-2 text-sm">
                <input name="esMaster" type="checkbox" />
                Es el Máster Final (no computa para el ranking de temporada)
            </label>

            {error && (
                <p className="rounded-lg bg-[#FDECEC] p-3 text-sm text-[#C73535]">{error}</p>
            )}

            <button
                type="submit"
                disabled={enviando}
                className="rounded-lg bg-[#F0443A] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
                {enviando ? "Creando…" : "Crear prueba"}
            </button>
        </form>
    );
}