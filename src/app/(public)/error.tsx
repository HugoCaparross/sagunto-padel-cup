"use client";

export default function PublicError({ unstable_retry }: { unstable_retry: () => void }) {
  return (
    <main className="max-w-2xl mx-auto px-5 py-16">
      <h1 className="font-display text-3xl mb-3">No hemos podido cargar esta página</h1>
      <p className="text-navy/70 mb-6">Puede ser un problema temporal. Vuelve a intentarlo en unos segundos.</p>
      <button type="button" onClick={unstable_retry} className="btn-primary">Reintentar</button>
    </main>
  );
}
