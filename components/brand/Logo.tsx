import Image from "next/image";

type Props = { className?: string; compact?: boolean };

export default function Logo({ className = "", compact = false }: Props) {
    return (
        <Image
            src="/sagunto-padel-cup-logo.png"
            alt="Sagunto Padel Cup"
            width={2030}
            height={768}
            loading="eager"
            className={`h-auto ${compact ? "w-[140px]" : "w-[150px] sm:w-[190px]"} ${className}`}
        />
    );
}