// Ruta: src/app/(public)/legal/cookies/page.tsx
export const metadata = { title: "Política de Cookies" };

export default function CookiesPage() {
  return (
    <main className="max-w-3xl mx-auto px-5 py-12 prose">
      <h1>Política de Cookies</h1>

      <h2>1. Qué es una cookie</h2>
      <p>
        Una cookie es un pequeño archivo que se almacena en tu dispositivo al
        visitar una web, y que permite recordar información sobre tu visita.
      </p>

      <h2>2. Cookies que utilizamos</h2>
      <table>
        <thead>
          <tr>
            <th>Cookie</th>
            <th>Finalidad</th>
            <th>Tipo</th>
            <th>Duración</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>sb-access-token / sb-refresh-token</td>
            <td>Mantener tu sesión iniciada</td>
            <td>Técnica (necesaria)</td>
            <td>Sesión / 1 semana</td>
          </tr>
          <tr>
            <td>spc_cookie_consent</td>
            <td>Recordar tu decisión sobre cookies</td>
            <td>Técnica (necesaria)</td>
            <td>1 año</td>
          </tr>
          <tr>
            <td>Vercel Analytics</td>
            <td>Medir visitas de forma agregada y anónima</td>
            <td>Analítica (requiere tu consentimiento)</td>
            <td>Variable</td>
          </tr>
        </tbody>
      </table>

      <h2>3. Cookies técnicas vs. analíticas</h2>
      <p>
        Las cookies técnicas son imprescindibles para el funcionamiento de la
        plataforma (por ejemplo, mantener tu sesión iniciada) y no requieren tu
        consentimiento. Las cookies analíticas solo se activan si pulsas
        &quot;Aceptar&quot; en el aviso de cookies, y puedes rechazarlas sin que
        eso afecte al uso normal de la web.
      </p>

      <h2>4. Cómo cambiar tu decisión</h2>
      <p>
        Puedes borrar las cookies de tu navegador en cualquier momento desde su
        configuración, lo que hará que el aviso de cookies vuelva a aparecer en
        tu próxima visita.
      </p>

      <p className="text-sm mt-8">Última actualización: 28 de julio de 2026</p>
    </main>
  );
}
