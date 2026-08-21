import type { ReactNode } from "react";

import "@/styles/circuito.css";

type CircuitoLayoutProps = Readonly<{
    children: ReactNode;
}>;

export default function CircuitoLayout({ children }: CircuitoLayoutProps) {
    return children;
}