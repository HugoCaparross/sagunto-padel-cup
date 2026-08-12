// Ruta: src/lib/consent.ts

export type ConsentValue =
  | "accepted"
  | "rejected";

const CONSENT_KEY =
  "spc_cookie_consent";

const ONE_YEAR_SECONDS =
  60 * 60 * 24 * 365;

function esConsentimiento(
  value: string,
): value is ConsentValue {
  return (
    value === "accepted" ||
    value === "rejected"
  );
}

function escaparRegex(
  value: string,
): string {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );
}

export function getConsent():
  | ConsentValue
  | null {
  if (
    typeof document ===
    "undefined"
  ) {
    return null;
  }

  const match =
    document.cookie.match(
      new RegExp(
        `(?:^|;\\s*)${escaparRegex(
          CONSENT_KEY,
        )}=([^;]*)`,
      ),
    );

  const value =
    match?.[1];

  if (!value) {
    return null;
  }

  const decoded =
    decodeURIComponent(
      value,
    );

  return esConsentimiento(
    decoded,
  )
    ? decoded
    : null;
}

export function setConsent(
  value: ConsentValue,
): void {
  if (
    typeof document ===
    "undefined"
  ) {
    return;
  }

  const secure =
    window.location.protocol ===
    "https:"
      ? "; Secure"
      : "";

  document.cookie = [
    `${CONSENT_KEY}=${encodeURIComponent(
      value,
    )}`,
    "path=/",
    `max-age=${ONE_YEAR_SECONDS}`,
    "SameSite=Lax",
    secure.replace(
      /^;\s*/,
      "",
    ),
  ]
    .filter(Boolean)
    .join("; ");
}