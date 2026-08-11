// Ruta: src/lib/consent.ts

export type ConsentValue =
  | "accepted"
  | "rejected";

const CONSENT_KEY =
  "spc_cookie_consent";

function esConsentimiento(
  value: string
): value is ConsentValue {
  return (
    value === "accepted" ||
    value === "rejected"
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

  const match = document.cookie.match(
    new RegExp(
      `(?:^|;\\s*)${CONSENT_KEY}=([^;]*)`
    )
  );

  const value = match?.[1];

  if (!value) {
    return null;
  }

  return esConsentimiento(value)
    ? value
    : null;
}

export function setConsent(
  value: ConsentValue
) {
  const oneYear =
    60 * 60 * 24 * 365;

  document.cookie = [
    `${CONSENT_KEY}=${value}`,
    "path=/",
    `max-age=${oneYear}`,
    "SameSite=Lax",
  ].join("; ");
}