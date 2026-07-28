// Ruta: src/app/(public)/legal/privacidad/page.tsx
export const metadata = { title: "Política de Privacidad" };

export default function PrivacidadPage() {
  return (
    <main className="max-w-3xl mx-auto px-5 py-12 prose">
      <h1>Política de Privacidad</h1>

      <h2>1. Responsable del tratamiento</h2>
      <p>
        Sagunto Padel Cup es el responsable del tratamiento de los datos
        personales recogidos a través de esta plataforma. Puedes contactar
        con el responsable, y solicitar sus datos identificativos completos
        (NIF y domicilio), a través del correo electrónico
        hugocaparrosbasterra@gmail.com.
      </p>

      <h2>2. Datos que recogemos</h2>
      <ul>
        <li>Datos de registro: nombre, apellidos, email, teléfono</li>
        <li>Datos de inscripción a torneos: categoría, pareja, talla de camiseta</li>
        <li>Datos de perfil opcionales: foto, edad, ciudad, mano dominante, pala, Instagram</li>
        <li>Estadísticas deportivas generadas por tu participación (resultados, ranking, puntos)</li>
        <li>Fotografías y vídeos tomados durante los torneos</li>
      </ul>

      <h2>3. Finalidad del tratamiento</h2>
      <p>
        Tus datos se utilizan para: gestionar tu inscripción y participación
        en los torneos, calcular y mostrar el ranking del circuito, enviarte
        notificaciones relacionadas con tu inscripción y los torneos, y
        mostrar tu perfil deportivo público (según lo que decidas hacer
        visible en tu configuración de privacidad).
      </p>

      <h2>4. Base legal</h2>
      <p>
        El tratamiento se basa en la ejecución de la relación que se
        establece al inscribirte en el circuito (art. 6.1.b RGPD) y, para los
        datos opcionales de perfil, en tu consentimiento expreso (art. 6.1.a
        RGPD), que puedes retirar en cualquier momento desde tu
        configuración.
      </p>

      <h2>5. Conservación de los datos</h2>
      <p>
        Conservamos tus datos mientras mantengas una cuenta activa en el
        circuito. Si te das de baja o tu cuenta es suspendida, tus datos
        personales identificativos (nombre, foto, teléfono) se anonimizan de
        forma automática transcurridos 12 meses desde la baja, salvo
        obligación legal de conservación superior.
      </p>

      <h2>6. Tus derechos</h2>
      <p>
        Puedes ejercer tus derechos de acceso, rectificación, supresión,
        oposición, limitación y portabilidad escribiendo a
        hugocaparrosbasterra@gmail.com. También puedes gestionar la
        visibilidad de tus datos opcionales de perfil directamente desde tu
        configuración en <code>/app/ajustes</code>, y solicitar la baja de tu
        cuenta en cualquier momento.
      </p>

      <h2>7. Terceros con los que compartimos datos</h2>
      <ul>
        <li>Supabase (alojamiento de base de datos y autenticación)</li>
        <li>Resend (envío de emails transaccionales)</li>
        <li>Vercel (alojamiento web y analítica, solo si aceptas cookies analíticas)</li>
      </ul>
      <p>
        No cedemos tus datos a terceros con fines comerciales ni realizamos
        transferencias internacionales fuera del Espacio Económico Europeo
        sin las garantías adecuadas.
      </p>

      <h2>8. Reclamaciones</h2>
      <p>
        Si consideras que el tratamiento de tus datos no se ajusta a la
        normativa, puedes presentar una reclamación ante la Agencia Española
        de Protección de Datos (www.aepd.es).
      </p>

      <p className="text-sm mt-8">
        Última actualización: 28 de julio de 2026
      </p>
    </main>
  );
}