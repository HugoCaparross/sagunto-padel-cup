// Ruta: src/app/(public)/legal/aviso-legal/page.tsx
export const metadata = { title: "Aviso Legal" };

export default function AvisoLegalPage() {
  return (
    <main className="max-w-3xl mx-auto px-5 py-12 prose">
      <h1>Aviso Legal</h1>

      <h2>1. Datos identificativos</h2>
      <p>
        En cumplimiento del artículo 10 de la Ley 34/2002, de Servicios de la
        Sociedad de la Información y Comercio Electrónico (LSSI-CE), se
        informa de los siguientes datos: el titular de este sitio web es
        Sagunto Padel Cup, cuyos datos identificativos completos (NIF y
        domicilio) están disponibles previa solicitud a través del correo
        electrónico de contacto hugocaparrosbasterra@gmail.com.
      </p>

      <h2>2. Objeto</h2>
      <p>
        Este sitio web tiene como finalidad la gestión de inscripciones,
        difusión de resultados, ranking y contenidos relacionados con el
        circuito amateur de pádel Sagunto Padel Cup.
      </p>

      <h2>3. Condiciones de uso</h2>
      <p>
        El acceso y uso de este sitio web atribuye la condición de usuario e
        implica la aceptación de las condiciones incluidas en este Aviso
        Legal. El usuario se compromete a hacer un uso adecuado de los
        contenidos y servicios que se ofrecen, y a no emplearlos para incurrir
        en actividades ilícitas o contrarias a la buena fe.
      </p>

      <h2>4. Propiedad intelectual</h2>
      <p>
        Los contenidos de este sitio web (textos, imágenes, logotipos,
        diseño, código) son propiedad de Sagunto Padel Cup o de terceros que
        han autorizado su uso, y están protegidos por la normativa de
        propiedad intelectual e industrial. Queda prohibida su reproducción
        total o parcial sin autorización expresa.
      </p>

      <h2>5. Responsabilidad</h2>
      <p>
        Sagunto Padel Cup no se hace responsable de los daños derivados de un
        uso indebido de este sitio web, ni de la posible falta de
        disponibilidad o continuidad del servicio por causas ajenas a su
        voluntad.
      </p>

      <h2>6. Legislación aplicable</h2>
      <p>
        Las presentes condiciones se rigen por la legislación española. Para
        la resolución de cualquier controversia, las partes se someten a los
        juzgados y tribunales que correspondan según la normativa vigente.
      </p>

      <p className="text-sm mt-8">
        Última actualización: 28 de julio de 2026
      </p>
    </main>
  );
}