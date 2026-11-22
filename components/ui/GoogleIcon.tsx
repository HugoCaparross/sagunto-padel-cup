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
    | "close"
    | "event"
    | "event_available"
    | "emoji_events"
    | "group"
    | "groups"
    | "leaderboard"
    | "lock"
    | "location_on"
    | "newspaper"
    | "open_in_new"
    | "payments"
    | "person_add"
    | "person"
    | "photo_camera"
    | "schedule"
    | "sports_tennis"
    | "sports_score"
    | "trending_up"
    | "upload"
    | "music_note";

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
