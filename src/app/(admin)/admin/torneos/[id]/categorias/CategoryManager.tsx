"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { Category, TournamentCategory } from "@/types/database";
import { saveTournamentCategoryAction } from "./actions";
import styles from "./page.module.css";

function Submit({ label }: { label: string }) {
    const { pending } = useFormStatus();
    return <button className={styles.button} disabled={pending}>{pending ? "Guardando…" : label}</button>;
}

function Feedback({ state }: { state: { error?: string; success?: string } }) {
    return <>{state.error && <p role="alert" className={styles.error}>{state.error}</p>}{state.success && <p role="status" className={styles.success}>{state.success}</p>}</>;
}

export default function CategoryManager({ tournamentId, categories, attached }: { tournamentId: string; categories: Category[]; attached: TournamentCategory[] }) {
    const action = saveTournamentCategoryAction.bind(null, tournamentId);
    const [addState, addAction] = useActionState(action, {});
    const available = categories.filter((category) => category.active && !attached.some((item) => item.categoria_id === category.id));
    return <div className={styles.stack}>
        <section className={styles.panel}>
            <h2>Añadir categoría</h2>
            {available.length ? <form action={addAction} className={styles.form}>
                <input type="hidden" name="mode" value="add" />
                <label>Categoría<select name="categoryId" required defaultValue=""><option value="" disabled>Selecciona una categoría</option>{available.map((category) => <option key={category.id} value={category.id}>{category.nombre}</option>)}</select></label>
                <label>Cupo mínimo<input name="minCapacity" type="number" min={0} placeholder="Sin mínimo" /></label>
                <label>Cupo máximo<input name="maxCapacity" type="number" min={0} placeholder="Sin máximo" /></label>
                <label className={styles.check}><input type="checkbox" name="enabled" defaultChecked /> Inscripciones habilitadas en esta categoría</label>
                <Feedback state={addState} /><Submit label="Añadir categoría" />
            </form> : <p className={styles.muted}>No hay más categorías activas disponibles para añadir.</p>}
        </section>
        <section className={styles.panel}>
            <h2>Categorías del torneo</h2>
            {!attached.length ? <p className={styles.muted}>Todavía no hay categorías en este torneo.</p> : <div className={styles.list}>{attached.map((item) => {
                const category = categories.find((candidate) => candidate.id === item.categoria_id);
                if (!category) return <p key={item.categoria_id} className={styles.warning}>Categoría {item.categoria_id}: no existe en el catálogo; requiere revisión.</p>;
                return <CategoryRow key={item.categoria_id} action={action} category={category} item={item} />;
            })}</div>}
        </section>
    </div>;
}

function CategoryRow({ action, category, item }: { action: (state: { error?: string; success?: string }, formData: FormData) => Promise<{ error?: string; success?: string }>; category: Category; item: TournamentCategory }) {
    const [state, formAction] = useActionState(action, {});
    return <form action={formAction} className={styles.row}>
        <input type="hidden" name="mode" value="update" /><input type="hidden" name="categoryId" value={item.categoria_id} />
        <h3>{category.nombre}</h3>
        <label>Cupo mínimo<input name="minCapacity" type="number" min={0} defaultValue={item.cupo_minimo ?? ""} placeholder="Sin mínimo" /></label>
        <label>Cupo máximo<input name="maxCapacity" type="number" min={0} defaultValue={item.cupo_maximo ?? ""} placeholder="Sin máximo" /></label>
        <label className={styles.check}><input type="checkbox" name="enabled" defaultChecked={item.enabled} /> Inscripciones habilitadas</label>
        <Feedback state={state} /><Submit label="Guardar categoría" />
    </form>;
}
