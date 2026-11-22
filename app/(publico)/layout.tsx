import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";

export default function LayoutPublico({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <>
            <SiteHeader />
            <div className="site-content min-h-[70vh]">{children}</div>
            <SiteFooter />
        </>
    );
}