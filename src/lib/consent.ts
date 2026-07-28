// Ruta: src/lib/consent.ts
export type ConsentValue = "accepted" | "rejected";

const CONSENT_KEY = "spc_cookie_consent";

export function getConsent(): ConsentValue | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^| )${CONSENT_KEY}=([^;]+)`));
  return (match?.[2] as ConsentValue) ?? null;
}

export function setConsent(value: ConsentValue) {
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${CONSENT_KEY}=${value}; path=/; max-age=${oneYear}; SameSite=Lax`;
}