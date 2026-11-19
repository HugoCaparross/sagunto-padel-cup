type Props = { className?: string };

// Líneas de nivel decorativas. Son fijas, sin aleatoriedad, para que el render sea estable.
export default function FondoTopografico({ className = "" }: Props) {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 1200 800"
            preserveAspectRatio="xMidYMid slice"
            className={className}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
        >
            {Array.from({ length: 9 }, (_, i) => {
                const y = 60 + i * 80;
                return (
                    <path
                        key={i}
                        d={`M0 ${y} C 200 ${y - 60}, 400 ${y + 60}, 600 ${y} S 1000 ${y - 60}, 1200 ${y}`}
                    />
                );
            })}
        </svg>
    );
}