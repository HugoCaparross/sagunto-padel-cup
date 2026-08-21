import type { ReactNode } from "react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "@/styles/home.css";

type PublicLayoutProps = {
  children: ReactNode;
};

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="public-site">
      <Header />

      <div className="public-site__content">{children}</div>

      <Footer />
    </div>
  );
}