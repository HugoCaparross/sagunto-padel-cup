type Props = { className?: string };

// Logo en texto mientras no exista el archivo gráfico definitivo.
export default function Logo({ className = "" }: Props) {
    return (
        <span className={`heading-font tracking-wide ${className}`}>
            SAGUNTO <span className="text-[#F0443A]">PADEL CUP</span>
        </span>
    );
}