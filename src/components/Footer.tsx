// Ruta: src/components/Footer.tsx
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-navy text-offwhite/70 px-5 py-8 mt-16 text-sm">
      <div className="max-w-3xl mx-auto flex flex-wrap justify-between gap-4">
        <p>© {new Date().getFullYear()} Sagunto Padel Cup</p>
        <nav className="flex flex-wrap gap-4">
          <Link href="/legal/aviso-legal" className="hover:text-offwhite">
            Aviso legal
          </Link>
          <Link href="/legal/privacidad" className="hover:text-offwhite">
            Privacidad
          </Link>
          <Link href="/legal/cookies" className="hover:text-offwhite">
            Cookies
          </Link>
          <Link href="/contacto" className="hover:text-offwhite">
            Contacto
          </Link>
        </nav>
      </div>
    </footer>
  );
}