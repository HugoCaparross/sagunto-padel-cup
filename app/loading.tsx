export default function Cargando() {
    return (
        <div
            role="status"
            aria-live="polite"
            className="flex min-h-[40vh] items-center justify-center p-8"
        >
            <span className="sr-only">Cargando…</span>
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-coral" />
        </div>
    );
}