// Ruta: src/components/Header.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(public)/login/actions";

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="bg-navy text-offwhite px-5 py-4 flex items-center justify-between flex-wrap gap-3">
      <Link href="/" className="font-display text-lg">
        Sagunto Padel Cup
      </Link>

      <nav className="flex items-center gap-4 text-sm flex-wrap">
        <Link href="/calendario">Calendario</Link>
        <Link href="/ranking">Ranking</Link>
        <Link href="/jugadores">Jugadores</Link>
        <Link href="/circuito">El Circuito</Link>

        {user ? (
          <>
            <Link href="/app" className="text-sage">
              Mi cuenta
            </Link>
            <form action={logout}>
              <button type="submit" className="underline">
                Salir
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login">Entrar</Link>
            <Link
              href="/registro"
              className="rounded-card bg-coral px-4 py-2 font-semibold"
            >
              Crear cuenta
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}