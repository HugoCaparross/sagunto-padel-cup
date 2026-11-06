/** Convierte "2026-11-14T09:00" (hora de Madrid) a ISO UTC, sea cual sea la zona del servidor. */
export function madridToIso(local: string | null | undefined): string | null {
    if (!local) return null;

    const asUtc = new Date(`${local}Z`);
    if (Number.isNaN(asUtc.getTime())) return null;

    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Europe/Madrid",
        hourCycle: "h23",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    }).formatToParts(asUtc);

    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);

    const madridAsUtc = Date.UTC(
        get("year"),
        get("month") - 1,
        get("day"),
        get("hour"),
        get("minute"),
        get("second"),
    );

    const offset = madridAsUtc - asUtc.getTime();
    return new Date(asUtc.getTime() - offset).toISOString();
}