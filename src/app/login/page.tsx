// Ruta: src/app/login/page.tsx
import LoginForm from "@/components/LoginForm";

export const metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <main className="max-w-md mx-auto px-5 py-16">
      <h1 className="font-display text-3xl mb-8">Iniciar sesión</h1>
      <LoginForm />
    </main>
  );
}