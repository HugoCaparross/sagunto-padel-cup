export default function PublicLoading() {
  return (
    <main className="max-w-3xl mx-auto px-5 py-12 animate-pulse" aria-label="Cargando contenido">
      <div className="h-10 w-2/3 rounded bg-navy/10 mb-5" />
      <div className="h-5 w-full rounded bg-navy/10 mb-3" />
      <div className="h-5 w-4/5 rounded bg-navy/10 mb-8" />
      <div className="h-36 rounded-card bg-navy/10" />
    </main>
  );
}
