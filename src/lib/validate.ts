export function parseUrl(raw: string): { valid: boolean; value: string | null } {
    const v = raw.trim();
    if (!v) return { valid: true, value: null };
    try {
        const u = new URL(v);
        if (u.protocol !== "https:" && u.protocol !== "http:") {
            return { valid: false, value: null };
        }
        return { valid: true, value: u.toString() };
    } catch {
        return { valid: false, value: null };
    }
}