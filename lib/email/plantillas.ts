import { euros, fechaLarga } from "@/lib/formato";

// Cada plantilla describe el contenido; renderHtml y renderTexto lo convierten en correo.
type Contenido = { asunto: string; titulo: string; lineas: string[] };

export type DatosAviso = {
    nombre: string;
    prueba: string;
    categoria: string;
    fechaInicio: string;
    precioCentimos: number;
};

const escapar = (s: string) =>
    s.replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string
    );

export function renderHtml(c: Contenido): string {
    const parrafos = c.lineas
        .map((l) => `<p style="margin:0 0 12px;line-height:1.6">${escapar(l)}</p>`)
        .join("");

    return `<!doctype html>
<html lang="es">
<body style="margin:0;padding:24px;background:#F4F5F4;font-family:Arial,Helvetica,sans-serif;color:#18232D">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#FFFFFF;border:1px solid #D5D9DC;border-radius:12px">
<tr><td style="background:#0D1B2A;color:#FFFFFF;padding:18px 24px;border-radius:12px 12px 0 0;font-weight:bold;letter-spacing:1px">SAGUNTO PADEL CUP</td></tr>
<tr><td style="padding:24px"><h1 style="margin:0 0 16px;font-size:20px">${escapar(c.titulo)}</h1>${parrafos}</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #D5D9DC;font-size:12px;color:#68737D">Este email es informativo. Para cualquier duda, responde a este mensaje o escribe a saguntopadelcup@gmail.com.</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export function renderTexto(c: Contenido): string {
    return [c.titulo, "", ...c.lineas, "", "Sagunto Padel Cup"].join("\n");
}

function importe(d: DatosAviso): string {
    return `${euros(d.precioCentimos)} por pareja, en efectivo el primer día de la prueba (${fechaLarga(d.fechaInicio)})`;
}

export function inscripcionRegistrada(d: DatosAviso & { enListaEspera: boolean }): Contenido {
    if (d.enListaEspera) {
        return {
            asunto: `Lista de espera · ${d.prueba}`,
            titulo: "Estás en lista de espera",
            lineas: [
                `Hola ${d.nombre}.`,
                `La prueba ${d.prueba} está completa en la categoría ${d.categoria}, así que tu inscripción ha quedado en lista de espera.`,
                "Si se libera una plaza, entrarás automáticamente y te avisaremos por email.",
            ],
        };
    }

    return {
        asunto: `Inscripción registrada · ${d.prueba}`,
        titulo: "Hemos registrado tu inscripción",
        lineas: [
            `Hola ${d.nombre}.`,
            `Tu inscripción en ${d.prueba}, categoría ${d.categoria}, queda pendiente de confirmación. El organizador la validará y te avisaremos por email.`,
            `Recuerda: ${importe(d)}.`,
        ],
    };
}

export function inscripcionConfirmada(d: DatosAviso): Contenido {
    return {
        asunto: `Inscripción confirmada · ${d.prueba}`,
        titulo: "Tu plaza está confirmada",
        lineas: [
            `Hola ${d.nombre}.`,
            `Tu inscripción en ${d.prueba}, categoría ${d.categoria}, está confirmada.`,
            `Recuerda: ${importe(d)}.`,
        ],
    };
}

export function plazaLiberada(d: DatosAviso): Contenido {
    return {
        asunto: `Tienes plaza · ${d.prueba}`,
        titulo: "Se ha liberado una plaza",
        lineas: [
            `Hola ${d.nombre}.`,
            `Tu inscripción en ${d.prueba}, categoría ${d.categoria}, ha pasado de la lista de espera a pendiente de confirmación. El organizador la validará y te avisaremos.`,
            `Recuerda: ${importe(d)}.`,
        ],
    };
}

export function inscripcionCancelada(d: DatosAviso): Contenido {
    return {
        asunto: `Inscripción cancelada · ${d.prueba}`,
        titulo: "Inscripción cancelada",
        lineas: [
            `Hola ${d.nombre}.`,
            `La inscripción en ${d.prueba}, categoría ${d.categoria}, ha quedado cancelada.`,
            "Si crees que es un error, escríbenos a saguntopadelcup@gmail.com.",
        ],
    };
}