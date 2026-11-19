import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { rutaSegura } from "@/lib/auth/rutas";
import { crearClienteServidor } from "@/lib/supabase/server";

const TIPOS: readonly EmailOtpType[] = [
    "signup",
    "recovery",
    "email",
    "invite",
    "magiclink",
    "email_change",
];

// Destino de los enlaces de confirmación y recuperación.
// Acepta el formato PKCE (code) y el de token (token_hash + type).
export async function GET(request: NextRequest) {
    const { searchParams, origin } = request.nextUrl;
    const code = searchParams.get("code");
    const tokenHash = searchParams.get("token_hash");
    const tipo = searchParams.get("type") as EmailOtpType | null;
    const destino = rutaSegura(searchParams.get("next"), "/cuenta");

    const supabase = await crearClienteServidor();
    let ok = false;

    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        ok = !error;
    } else if (tokenHash && tipo && TIPOS.includes(tipo)) {
        const { error } = await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash });
        ok = !error;
    }

    if (!ok) return NextResponse.redirect(new URL("/login?error=enlace", origin));
    return NextResponse.redirect(new URL(destino, origin));
}