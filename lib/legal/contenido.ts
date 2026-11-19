import type { TipoDocumento } from "@/lib/legal/requisitos";

// Textos iniciales de los documentos legales.
// Se publican desde el panel con publicarDocumentosIniciales (actions/legal-inicial.ts).
// Para cambiar un texto después, crea una versión nueva desde /admin/legal.

export const DOCUMENTOS_INICIALES: Record<
    TipoDocumento,
    { titulo: string; contenido: string }
> = {
    aviso_legal: {
        titulo: "Aviso legal",
        contenido: `## 1. Titular del sitio web

Esta web es titularidad de Hugo Caparrós, que organiza el circuito amateur de pádel Sagunto Padel Cup en la comarca del Camp de Morvedre (Valencia).

Contacto: saguntopadelcup@gmail.com

## 2. Objeto

La web ofrece información del circuito: calendario, ranking, resultados, noticias, reglamento y formulario de inscripción.

## 3. Inscripciones

La inscripción en la web es una solicitud de plaza. La web no procesa pagos ni almacena datos de pago. El importe se abona en efectivo el primer día de la prueba, según las condiciones de participación.

## 4. Condiciones de uso

El usuario se compromete a usar la web de forma lícita y a facilitar datos veraces en los formularios. El titular puede modificar o retirar contenidos sin previo aviso.

## 5. Propiedad intelectual

Los contenidos, el diseño y el logotipo son propiedad del titular o se usan con autorización. Queda prohibida su reproducción sin permiso, salvo para uso personal y privado.

## 6. Responsabilidad

El titular procura que la información esté actualizada, pero no garantiza la ausencia de errores. Los resultados pueden corregirse conforme al reglamento.

## 7. Enlaces externos

La web incluye enlaces a servicios de terceros, como mapas de las sedes y redes sociales. El titular no responde de sus contenidos ni de sus políticas.

## 8. Legislación y jurisdicción

Esta web se rige por la legislación española. Para los consumidores, serán competentes los tribunales de su domicilio, según la ley.`,
    },

    privacidad: {
        titulo: "Política de privacidad",
        contenido: `## 1. Responsable del tratamiento

El responsable del tratamiento es Hugo Caparrós, bajo el nombre comercial Sagunto Padel Cup. Para ejercer derechos o hacer consultas: saguntopadelcup@gmail.com.

## 2. Datos que se tratan y finalidades

| Datos | Finalidad | Base jurídica | Plazo |
|---|---|---|---|
| Nombre, email y talla de camiseta | Gestionar la inscripción y la participación | Ejecución del contrato | Hasta 1 año después de finalizar la temporada |
| Inscripciones, resultados y puntos | Gestionar el circuito y calcular el ranking | Ejecución del contrato y transparencia del circuito | 5 años desde la última participación |
| Datos deportivos opcionales (lado de pista, mano, pala) | Mostrarlos en el perfil público, si lo decides | Consentimiento | Hasta que los retires o borres tu cuenta |
| Imagen en fotos y vídeos de las pruebas | Publicarlas en la web y redes del circuito | Consentimiento específico | Hasta que retires el consentimiento |
| Mensajes de contacto y sugerencias | Responder a tu consulta | Tu solicitud e interés legítimo | 12 meses desde el cierre de la consulta |
| Registro de consentimientos | Demostrar lo que aceptaste | Obligación legal | Mientras dure la cuenta |
| Confirmación de mayoría de edad o autorización del tutor | Participar en las pruebas | Consentimiento | Mientras dure la cuenta |

No pedimos fecha de nacimiento. Si eres menor, necesitas la autorización de tu tutor legal, y basta con confirmarlo al registrarte.

## 3. Publicación de datos

El ranking y los perfiles públicos muestran nombre y resultados solo si activas la visibilidad pública en tu perfil. En otro caso aparecen como "Jugador privado", con su posición y puntos.

## 4. Pagos

La web no recibe ni guarda datos de pago. Las inscripciones se abonan en efectivo el primer día de la prueba.

## 5. Encargados del tratamiento y ubicación

Los datos se alojan en Supabase, en su región de Frankfurt (Alemania), dentro de la Unión Europea. No se realizan transferencias fuera de la UE. Supabase actúa como encargado del tratamiento.

## 6. Cookies

Ver la política de cookies.

## 7. Tus derechos

Puedes acceder, rectificar, suprimir, limitar, oponerte o pedir la portabilidad de tus datos escribiendo a saguntopadelcup@gmail.com. También puedes retirar tus consentimientos en cualquier momento, sin que eso afecte a lo tratado antes.

## 8. Reclamaciones

Si consideras que tus derechos no se han atendido, puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).

## 9. Seguridad

Los datos se protegen con cifrado en tránsito, control de acceso por roles y registro de cambios del organizador.

## 10. Cambios

Esta política puede actualizarse. Si los cambios son relevantes, se avisará en la web antes de aplicarlos.`,
    },

    cookies: {
        titulo: "Política de cookies",
        contenido: `## 1. Qué son las cookies

Las cookies son pequeños archivos que el navegador guarda al visitar una web.

## 2. Cookies que usa esta web

| Nombre | Tipo | Finalidad | Duración |
|---|---|---|---|
| sb-...-auth-token | Técnica | Mantener la sesión iniciada | Mientras dure la sesión; se elimina al cerrarla |

Esta web no usa cookies de analítica ni de publicidad. Si en el futuro se añaden, se actualizará esta página y se pedirá tu consentimiento antes de cargarlas.

## 3. Cookies de terceros

No hay cookies de terceros en el funcionamiento normal de la web. Los enlaces a mapas y redes sociales llevan a servicios externos, que aplican sus propias políticas al usarlos.

## 4. Cómo gestionarlas

Puedes borrar o bloquear las cookies desde la configuración de tu navegador. Si bloqueas la cookie de sesión, no podrás iniciar sesión.`,
    },

    condiciones_inscripcion: {
        titulo: "Condiciones de participación",
        contenido: `## 1. Objeto

Estas condiciones regulan la inscripción en las pruebas del circuito Sagunto Padel Cup.

## 2. Inscripción

La inscripción en la web es una solicitud de plaza. Puede estar pendiente, confirmada o en lista de espera. La plaza queda asegurada cuando el organizador la confirma.

## 3. Precio y pago

El precio por pareja se indica en cada prueba. Se paga en efectivo el primer día de la prueba, en el lugar que se indique. No se admiten pagos por transferencia ni en la web.

## 4. Categorías y mínimo de parejas

Una categoría se disputa si tiene al menos 3 parejas inscritas. Si no llega a ese mínimo, no se disputa y no se cobra la inscripción, porque el pago se hace el primer día.

## 5. Plazas

Cada prueba tiene un número máximo de parejas. Cuando se completa, las nuevas inscripciones pasan a lista de espera y entran si se libera una plaza.

## 6. Retirada y no presentación

Puedes retirarte desde la web sin coste mientras la prueba no esté en curso. Como el pago es en persona, una retirada no genera ningún cargo.

Si la pareja no se presenta el primer día sin haber avisado, la inscripción no se paga.

## 7. Desistimiento

El derecho de desistimiento de 14 días no se aplica a servicios de ocio que deban prestarse en una fecha o periodo determinado (art. 103 del TRLGDCU). Esta política de retirada sustituye a ese derecho.

## 8. Cancelación o cambios por el organizador

Si el organizador cancela una prueba o cambia la fecha o la sede, lo comunicará por email. Como el pago es el primer día, no se cobrará a quien no pueda asistir.

## 9. Fuerza mayor

Ninguna de las partes responde por incumplimientos debidos a causas de fuerza mayor. En ese caso, se aplicará lo que decida el organizador.

## 10. Participación bajo responsabilidad propia

Cada participante compite bajo su responsabilidad y declara estar en condiciones físicas para hacerlo.

## 11. Imagen

La participación puede incluir fotografías y vídeos. La autorización de imagen es voluntaria y se registra por separado en tu perfil.

## 12. Aceptación

Al inscribirte, aceptas estas condiciones y el reglamento del circuito.`,
    },

    reglamento: {
        titulo: "Reglamento del circuito",
        contenido: `## 1. Ámbito

El reglamento regula las pruebas de la temporada 2026-2027 y el Máster Final. Se aplica a todos los participantes inscritos.

## 2. Categorías

Hay cuatro categorías: 1.ª, 2.ª, 3.ª y 4.ª. Cada prueba indica en qué categorías se disputa.

## 3. Formato de grupos

- Hasta 5 parejas: un grupo.
- Desde 6 parejas: dos grupos.
- Dentro de cada grupo, todas las parejas juegan entre sí. En grupos de 3, la vuelta se repite invirtiendo los lados.

## 4. Fase final

Según el número de parejas, la fase final se organiza en cuadros de oro, plata y bronce. El cuadro de cada pareja se publica una vez terminada la fase de grupos.

## 5. Formato de partido

| Fase | Formato |
|---|---|
| Grupos | 1 set a 6 juegos, punto de oro, tie-break a 6-6 |
| Fase final (salvo final) | 1 set a 9 juegos, punto de oro, tie-break a 8-8 |
| Final | 2 sets, punto de oro. Si hay tercer set, supertie-break a 10 puntos |

## 6. Desempates en grupos

1. Juegos ganados.
2. Juegos perdidos (menos es mejor).
3. Enfrentamiento directo, cuando solo quedan dos parejas empatadas.
4. Sorteo, si ningún criterio separa a las parejas.

## 7. Horarios y pistas

Cada partido se publica con su pista y hora. El organizador puede modificar horarios por causas justificadas y lo comunicará con la mayor antelación posible.

## 8. Puntualidad

Hay una tolerancia de 15 minutos desde la hora de inicio. Si una pareja no se presenta en ese plazo, pierde el partido por incomparecencia.

## 9. Puntos y ranking

Los puntos se asignan a cada jugador, no a la pareja. Cada resultado cuenta durante 12 meses desde la fecha de la prueba. La escala de puntos se publica en la web.

## 10. Conducta

Se espera respeto hacia los jugadores, el público y la organización. El organizador puede sancionar conductas antideportivas, desde una amonestación hasta la exclusión del circuito, según la gravedad.

## 11. Imagen

Las fotografías y vídeos de las pruebas se publican solo con autorización. Puedes retirarla en cualquier momento escribiendo a saguntopadelcup@gmail.com.

## 12. Menores

Los menores de edad participan con autorización de su tutor legal, confirmada al registrarse.

## 13. Modificaciones

El organizador puede modificar este reglamento. Los cambios se comunicarán en la web con 7 días de antelación y no se aplicarán a pruebas ya iniciadas.`,
    },
};