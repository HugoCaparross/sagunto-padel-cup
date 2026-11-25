"use client";

import Boton from "@/components/ui/Boton";

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
        const aIso = (value: FormDataEntryValue | null) => {
            const fechaLocal = String(value ?? "");
            return fechaLocal ? new Date(fechaLocal).toISOString() : null;
        };

        setEnviando(true);
        setError(null);

        const res = await crearPrueba({
            nombre: String(f.get("nombre") ?? ""),
            slug: slug || undefined,
            fechaInicio: String(f.get("fechaInicio") ?? ""),
            fechaFin: String(f.get("fechaFin") ?? ""),
            inscripcionesAbrenAt: aIso(f.get("inscripcionesAbrenAt")),
            inscripcionesCierranAt: aIso(f.get("inscripcionesCierranAt")),
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

    const campo = "rounded-md border border-[var(--color-border)] bg-white px-2 py-1.5 text-sm";

    return (
        <form onSubmit={enviar} className="max-w-2xl space-y-6 rounded-xl bg-white p-6 ring-1 ring-[var(--color-border)]">
            <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                    <span className="text-[var(--color-muted)]">Nombre</span>
                    <input name="nombre" required minLength={3} maxLength={80} className={campo} placeholder="Prueba 3" />
                </label>

                <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                    <span className="text-[var(--color-muted)]">Slug (opcional, se genera del nombre)</span>
                    <input name="slug" maxLength={80} className={campo} placeholder="prueba-3-2027" />
                </label>

                <label className="flex flex-col gap-1 text-sm">
                    <span className="text-[var(--color-muted)]">Fecha de inicio</span>
                    <input name="fechaInicio" type="date" required className={campo} />
                </label>

                <label className="flex flex-col gap-1 text-sm">
                    <span className="text-[var(--color-muted)]">Fecha de fin</span>
                    <input name="fechaFin" type="date" required className={campo} />
                </label>

                <label className="flex flex-col gap-1 text-sm">
                    <span className="text-[var(--color-muted)]">Abren inscripciones</span>
                    <input name="inscripcionesAbrenAt" type="datetime-local" className={campo} />
                </label>

                <label className="flex flex-col gap-1 text-sm">
                    <span className="text-[var(--color-muted)]">Cierran inscripciones</span>
                    <input name="inscripcionesCierranAt" type="datetime-local" className={campo} />
                </label>

                <label className="flex flex-col gap-1 text-sm">
                    <span className="text-[var(--color-muted)]">Hora de inicio</span>
                    <input name="horaInicio" type="time" defaultValue="09:00" required className={campo} />
                </label>

                <label className="flex flex-col gap-1 text-sm">
                    <span className="text-[var(--color-muted)]">Hora de fin</span>
                    <input name="horaFin" type="time" defaultValue="13:00" required className={campo} />
                </label>

                <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                    <span className="text-[var(--color-muted)]">Sede</span>
                    <input name="sede" required className={campo} placeholder="Polideportivo René Marigil" />
                </label>

                <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                    <span className="text-[var(--color-muted)]">Enlace al mapa (opcional)</span>
                    <input name="sedeUrl" type="url" className={campo} placeholder="https://maps.google.com/..." />
                </label>

                <label className="flex flex-col gap-1 text-sm">
                    <span className="text-[var(--color-muted)]">Precio por pareja (€, se paga en efectivo)</span>
                    <input name="precio" inputMode="decimal" required className={campo} placeholder="25" />
                </label>

                <label className="flex flex-col gap-1 text-sm">
                    <span className="text-[var(--color-muted)]">Parejas máximas</span>
                    <input name="plazas" type="number" min={3} max={200} defaultValue={24} required className={campo} />
                </label>
            </div>

            <fieldset className="space-y-2">
                <legend className="text-sm text-[var(--color-muted)]">Categorías</legend>
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
                <p className="rounded-lg bg-[var(--color-danger-bg)] p-3 text-sm text-[var(--color-danger)]">{error}</p>
            )}

            <Boton variante="primario" tamano="md"
                type="submit"
                disabled={enviando}
                className="font-medium disabled:opacity-50"
            >
                {enviando ? "Creando…" : "Crear prueba"}
            </Boton>
        </form>
    );
}
