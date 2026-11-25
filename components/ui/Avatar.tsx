import AvatarJugador from "@/components/ui/AvatarJugador";

type Props = { nombre: string; src?: string | null; tamano?: "sm" | "md" | "lg"; className?: string };
const DIMENSION = { sm: 36, md: 48, lg: 80 } as const;

export default function Avatar({ nombre, src = null, tamano = "md", className = "" }: Props) {
    const dimension = DIMENSION[tamano];
    return <AvatarJugador nombre={nombre} src={src} className={`rounded-full ${className}`} sizes={`${dimension}px`} style={{ width: dimension, height: dimension }} />;
}
