const INTERNAL_ORIGIN = "https://sagunto-padel-cup.invalid";
const INVALID_PATH_CHARACTERS = /[\u0000-\u001f\u007f\\]/;
const ENCODED_SEPARATOR_OR_CONTROL = /%(?:2f|5c|0[0-9a-f]|1[0-9a-f]|7f)/i;
const MALFORMED_ESCAPE = /%(?![0-9a-f]{2})/i;

/**
 * Accepts only a normalized path on this application origin.
 * `new URL()` treats backslashes as slashes for special schemes, so reject
 * raw and encoded separators before parsing.
 */
export function getSafeNextPath(value: string | null): string | null {
    if (
        !value ||
        !value.startsWith("/") ||
        value.startsWith("//") ||
        INVALID_PATH_CHARACTERS.test(value) ||
        ENCODED_SEPARATOR_OR_CONTROL.test(value) ||
        MALFORMED_ESCAPE.test(value)
    ) {
        return null;
    }

    try {
        const destination = new URL(value, INTERNAL_ORIGIN);

        if (
            destination.origin !== INTERNAL_ORIGIN ||
            destination.username ||
            destination.password ||
            destination.pathname.startsWith("//")
        ) {
            return null;
        }

        return `${destination.pathname}${destination.search}${destination.hash}`;
    } catch {
        return null;
    }
}
