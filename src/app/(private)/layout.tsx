// Ruta: src/app/(private)/layout.tsx
import Header from "@/components/Header";

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}