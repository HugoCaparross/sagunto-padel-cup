import { requireUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/crm/ui";
import { updateProfile } from "./actions";
import styles from "@/components/crm/crm.module.css";

export const dynamic = "force-dynamic";

export default async function MyProfile() {
    const { supabase, user } = await requireUser("/jugador/perfil");

    const { data: profile } = await supabase
        .from("profiles")
        .select("display_name,bio,is_public")
        .eq("id", user.id)
        .maybeSingle();

    return (
        <>
            <PageHeader eyebrow="Mi cuenta" title="Mi perfil" />

            <section className={styles.card} style={{ maxWidth: 640 }}>
                <form action={updateProfile} className={styles.form}>
                    <label className={styles.field}>
                        <span>Nombre visible</span>
                        <input
                            name="display_name"
                            required
                            maxLength={80}
                            defaultValue={profile?.display_name ?? ""}
                        />
                    </label>

                    <label className={styles.field}>
                        <span>Biografía breve</span>
                        <textarea name="bio" rows={4} maxLength={500} defaultValue={profile?.bio ?? ""} />
                    </label>

                    <label className={styles.check}>
                        <input type="checkbox" name="is_public" defaultChecked={profile?.is_public ?? false} />
                        <span>Mostrar mi perfil público (nombre, posición y estadísticas)</span>
                    </label>

                    <button type="submit" className={styles.btnPrimary}>
                        Guardar cambios
                    </button>
                </form>

                <p className={styles.muted} style={{ fontSize: 12, marginTop: 20 }}>
                    El correo y el teléfono nunca se muestran públicamente. Los datos deportivos los gestiona la
                    organización.
                </p>
            </section>
        </>
    );
}