const PASOS = [
    {
        titulo: "Crea tu cuenta",
        texto: "Regístrate, confirma tu email y completa tu perfil una sola vez.",
    },
    {
        titulo: "Elige prueba y categoría",
        texto: "Inscríbete en la prueba que te interese. Si vas con pareja, tu compañero se une desde el tablón.",
    },
    {
        titulo: "Paga en la prueba",
        texto: "El pago es en efectivo el primer día. Tu plaza se confirma cuando el organizador la valida.",
    },
];

export default function ComoFunciona() {
    return (
        <section className="space-y-8">
            <h2 className="heading-font text-4xl">Cómo funciona</h2>
            <ol className="grid gap-4 md:grid-cols-3">
                {PASOS.map((p, i) => (
                    <li key={p.titulo} className="space-y-3 rounded-xl bg-white p-6 ring-1 ring-[#D5D9DC]">
                        <span className="heading-font text-4xl text-[#F0443A]">{i + 1}</span>
                        <h3 className="font-semibold">{p.titulo}</h3>
                        <p className="text-sm text-[#68737D]">{p.texto}</p>
                    </li>
                ))}
            </ol>
        </section>
    );
}