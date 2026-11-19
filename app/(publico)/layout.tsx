import SiteFooter from "@/components/layout/SiteFooter";

export default function LayoutPublico({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <>
            <div className="min-h-[70vh]">{children}</div>
            <SiteFooter />
        </>
    );
}