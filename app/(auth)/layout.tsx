import Link from "next/link";
import Logo from "@/components/brand/Logo";

export default function LayoutAutenticacion({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <div className="auth-shell">
            <header className="auth-brand">
                <Link href="/" aria-label="Volver al inicio">
                    <Logo />
                </Link>
            </header>
            <div className="auth-content">{children}</div>
        </div>
    );
}
