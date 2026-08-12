import Link from "next/link";
import { ArrowUpRight, Mail, MapPin } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      {/* ======================================================
          MAIN FOOTER
          ====================================================== */}

      <div className="home-shell site-footer__grid">
        {/* BRAND */}

        <div className="site-footer__brand">
          <Link
            href="/"
            className="site-brand site-brand--footer"
            aria-label="Sagunto Padel Cup — Inicio"
          >
            <span className="site-brand__mark" aria-hidden="true">
              S
            </span>

            <span className="site-brand__text">
              <strong>SAGUNTO</strong>

              <span>PADEL CUP</span>
            </span>
          </Link>

          <p>El circuito amateur de pádel de referencia en Sagunto.</p>
        </div>

        {/* ==================================================
            NAVIGATION
            ================================================== */}

        <nav aria-label="Navegación del footer" className="site-footer__column">
          <h2>Navegación</h2>

          <Link href="/circuito">Circuito</Link>

          <Link href="/calendario">Calendario</Link>

          <Link href="/ranking">Ranking</Link>

          <Link href="/master-final">Máster</Link>

          <Link href="/jugadores">Jugadores</Link>

          <Link href="/noticias">Noticias</Link>

          <Link href="/contacto">Contacto</Link>
        </nav>

        {/* ==================================================
            INFORMATION
            ================================================== */}

        <nav aria-label="Información legal" className="site-footer__column">
          <h2>Información</h2>

          <Link href="/circuito/reglamento">Reglamento</Link>

          <Link href="/circuito/faq">Preguntas frecuentes</Link>

          <Link href="/legal/privacidad">Política de privacidad</Link>

          <Link href="/legal/cookies">Cookies</Link>

          <Link href="/legal/aviso-legal">Aviso legal</Link>
        </nav>

        {/* ==================================================
            CONTACT
            ================================================== */}

        <div className="site-footer__column">
          <h2>Contacto</h2>

          <a
            href="mailto:torneos@saguntopadelcup.com"
            aria-label="Enviar correo a Sagunto Padel Cup"
          >
            <Mail size={15} strokeWidth={1.8} aria-hidden="true" />

            <span>torneos@saguntopadelcup.com</span>

            <ArrowUpRight size={13} strokeWidth={1.8} aria-hidden="true" />
          </a>

          <span>
            <MapPin size={15} strokeWidth={1.8} aria-hidden="true" />

            <span>Sagunto, Valencia</span>
          </span>
        </div>
      </div>

      {/* ======================================================
          BOTTOM BAR
          ====================================================== */}

      <div className="home-shell site-footer__bottom">
        <span>
          © {currentYear} Sagunto Padel Cup. Todos los derechos reservados.
        </span>

        <span>Compite. Suma. Llega al Máster.</span>
      </div>
    </footer>
  );
}
