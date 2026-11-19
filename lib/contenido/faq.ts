export type Pregunta = { pregunta: string; respuesta: string };

export type GrupoFaq = { titulo: string; preguntas: Pregunta[] };

// Las respuestas deben coincidir con el reglamento y las condiciones publicadas.
// Si cambian, actualízalas aquí y en la versión legal correspondiente.
export const FAQ: GrupoFaq[] = [
    {
        titulo: "Inscripciones",
        preguntas: [
            {
                pregunta: "¿Cómo me inscribo?",
                respuesta:
                    "Crea tu cuenta, completa tu perfil y elige la prueba en el calendario. Tu inscripción queda pendiente hasta que el organizador la confirma.",
            },
            {
                pregunta: "¿Tengo que ir con pareja?",
                respuesta:
                    "Puedes inscribirte solo. Tu compañero o compañera puede unirse desde el tablón de búsqueda de pareja, siempre que tenga cuenta en la web.",
            },
            {
                pregunta: "¿Cuánto cuesta?",
                respuesta:
                    "El precio por pareja aparece en cada prueba. Se paga en efectivo el primer día, en el lugar que indique el organizador.",
            },
            {
                pregunta: "¿Puedo pagar online o por transferencia?",
                respuesta: "No. Todos los pagos se realizan en efectivo el primer día de la prueba.",
            },
            {
                pregunta: "¿Qué pasa si se llena la prueba?",
                respuesta:
                    "Tu inscripción queda en lista de espera. Si se libera una plaza, entras automáticamente.",
            },
        ],
    },
    {
        titulo: "Categorías y formato",
        preguntas: [
            {
                pregunta: "¿Qué categorías hay?",
                respuesta:
                    "Hay cuatro: 1.ª, 2.ª, 3.ª y 4.ª. Cada prueba indica en cuáles se disputa.",
            },
            {
                pregunta: "¿Y si mi categoría no llega a 3 parejas?",
                respuesta:
                    "No se disputa y no se cobra la inscripción, porque el pago se hace el primer día.",
            },
            {
                pregunta: "¿Cómo son los partidos?",
                respuesta:
                    "En grupos, un set a 6 juegos con punto de oro y tie-break a 6-6. En la fase final, un set a 9 juegos. La final se juega a 2 sets, y si hay tercer set, se decide con un supertie-break.",
            },
            {
                pregunta: "¿Cómo se desempata en un grupo?",
                respuesta:
                    "Primero por juegos ganados, después por juegos perdidos y, si solo quedan dos parejas empatadas, por el enfrentamiento directo.",
            },
        ],
    },
    {
        titulo: "Puntos y ranking",
        preguntas: [
            {
                pregunta: "¿Los puntos son por pareja o por jugador?",
                respuesta:
                    "Por jugador. Cada persona acumula sus propios puntos, con independencia de con quién haya jugado.",
            },
            {
                pregunta: "¿Cuánto dura un resultado en el ranking?",
                respuesta:
                    "12 meses desde la fecha de la prueba. Después deja de contar, aunque tu nivel se mantiene.",
            },
            {
                pregunta: "¿Qué es el nivel?",
                respuesta:
                    "Es tu progreso en el circuito, calculado con tus puntos históricos, las pruebas que has jugado y tu porcentaje de victorias. No depende de tu categoría.",
            },
            {
                pregunta: "¿Puedo ocultar mi nombre en el ranking?",
                respuesta:
                    "Sí. Si no activas la visibilidad pública en tu perfil, aparecerás como 'Jugador privado', con tu posición y tus puntos.",
            },
        ],
    },
    {
        titulo: "Pruebas el día del torneo",
        preguntas: [
            {
                pregunta: "¿Cómo registro mi llegada?",
                respuesta:
                    "Desde tu panel, en Inscripciones, aparece un código QR. Enséñalo al llegar y el organizador lo escaneará.",
            },
            {
                pregunta: "¿Dónde veo mis partidos y las pistas?",
                respuesta:
                    "En la ficha de la prueba, en el apartado de partidos. La pista y la hora aparecen cuando el organizador las confirma.",
            },
            {
                pregunta: "¿Puedo retirarme?",
                respuesta:
                    "Sí, desde tu panel mientras la prueba no esté en curso. La retirada no genera ningún cargo, porque el pago es en persona.",
            },
        ],
    },
    {
        titulo: "Mi cuenta y privacidad",
        preguntas: [
            {
                pregunta: "¿Qué datos guardáis?",
                respuesta:
                    "Los necesarios para gestionar tus inscripciones, tus resultados y el ranking. Puedes consultarlos en tu perfil. Más detalles en la política de privacidad.",
            },
            {
                pregunta: "¿Cómo cambio mi imagen de fotos y vídeos?",
                respuesta:
                    "En tu perfil, en la sección de privacidad y consentimientos. El cambio queda registrado.",
            },
            {
                pregunta: "¿Puedo participar siendo menor de edad?",
                respuesta:
                    "Sí, con la autorización de tu tutor legal, que confirmas al registrarte.",
            },
        ],
    },
];