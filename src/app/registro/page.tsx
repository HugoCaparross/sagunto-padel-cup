// Ruta: src/app/registro/page.tsx
import SignupForm from "@/components/SignupForm";

export const metadata = { title: "Crear cuenta" };

export default function RegistroPage() {
  return (
    <main className="max-w-md mx-auto px-5 py-16">
      <h1 className="font-display text-3xl mb-8">Crear cuenta</h1>
      <SignupForm />
    </main>
  );
}
