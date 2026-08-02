// Ruta: src/app/registro/confirma/page.tsx
export const metadata = { title: "Confirma tu email" };

export default function ConfirmaPage() {
  return (
    <main className="max-w-md mx-auto px-5 py-16 text-center">
      <h1 className="font-display text-3xl mb-4">Revisa tu email</h1>
      <p className="text-navy/70">
        Te hemos enviado un enlace de confirmación. Haz clic en él para activar
        tu cuenta y poder inscribirte en los torneos.
      </p>
    </main>
  );
}
