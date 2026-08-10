export default function AppLoading() {
  return (
    <main className="max-w-2xl mx-auto px-5 py-12 animate-pulse" aria-label="Cargando tu cuenta">
      <div className="h-10 w-1/2 rounded bg-navy/10 mb-6" />
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="h-28 rounded-card bg-navy/10" />
        <div className="h-28 rounded-card bg-navy/10" />
      </div>
    </main>
  );
}
