// Ruta: src/app/(private)/app/torneos/page.tsx — sustituye entero al archivo actual
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CancelarButton from "@/components/CancelarButton";

export default async function MisTorneosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: player } = await supabase
    .from("players")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  const { data: inscripciones } = await supabase
    .from("pairs")
    .select(
      "id, estado, tournaments(nombre, slug), categories(nombre), registrations(qr_code, checked_in)"
    )
    .or(`player_1_id.eq.${player?.id ?? ""},player_2_id.eq.${player?.id ?? ""}`);

  return (
    <main className="max-w-2xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl mb-8">Mis torneos</h1>

      <ul className="space-y-4">
        {inscripciones?.map((i) => {
          const torneo = i.tournaments as unknown as { nombre: string; slug: string } | null;
          const categoria = i.categories as unknown as { nombre: string } | null;
          const registro = (i.registrations as unknown as { qr_code: string; checked_in: boolean }[])?.[0];
          const activa = i.estado !== "incompleta";

          return (
            <li key={i.id} className="rounded-card bg-navy/5 px-5 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{torneo?.nombre}</p>
                  <p className="text-sm text-navy/60">
                    {categoria?.nombre} · {i.estado}
                  </p>
                </div>
                {activa && <CancelarButton pairId={i.id} />}
              </div>

              {activa && i.estado === "confirmada" && registro?.qr_code && (
                <div className="mt-4 flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${registro.qr_code}`}
                    alt="Código QR de acceso"
                    className="rounded-card border border-navy/10"
                  />
                  <p className="text-sm text-navy/60">
                    {registro.checked_in
                      ? "✅ Ya has hecho check-in"
                      : "Enseña este código en la mesa de control el día del torneo"}
                  </p>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {!inscripciones?.length && (
        <p className="text-navy/70">Aún no te has inscrito a ningún torneo.</p>
      )}
    </main>
  );
}