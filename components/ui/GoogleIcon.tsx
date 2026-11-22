export type GoogleIconName =
    | "account_balance"
    | "account_circle"
    | "arrow_downward"
    | "arrow_forward"
    | "arrow_outward"
    | "calendar_month"
    | "campaign"
    | "category"
    | "check_circle"
    | "event"
    | "event_available"
    | "emoji_events"
    | "group"
    | "groups"
    | "leaderboard"
    | "location_on"
    | "newspaper"
    | "payments"
    | "person_add"
    | "schedule"
    | "sports_tennis"
    | "sports_score"
    | "trending_up";

type Props = {
    name: GoogleIconName;
    className?: string;
    filled?: boolean;
};

export default function GoogleIcon({ name, className = "", filled = false }: Props) {
    return (
        <span
            className={`google-icon${filled ? " google-icon-filled" : ""} ${className}`.trim()}
            aria-hidden="true"
        >
            {name}
        </span>
    );
}
