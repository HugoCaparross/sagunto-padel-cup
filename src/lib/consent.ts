// Ruta: src/lib/consent.ts

export type ConsentValue = "accepted" | "rejected";

export type ConsentPreferences = {
  necessary: true;
  analytics: boolean;
};

const CONSENT_KEY = "spc_cookie_consent";

const CONSENT_PREFERENCES_KEY = "spc_cookie_preferences";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function esConsentimiento(value: string): value is ConsentValue {
  return value === "accepted" || value === "rejected";
}

function decodeCookie(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getCookie(key: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${escapedKey}=([^;]*)`),
  );

  return match?.[1] ? decodeCookie(match[1]) : null;
}

export function getConsent(): ConsentValue | null {
  const value = getCookie(CONSENT_KEY);

  if (!value) {
    return null;
  }

  return esConsentimiento(value) ? value : null;
}

export function getConsentPreferences(): ConsentPreferences | null {
  const value = getCookie(CONSENT_PREFERENCES_KEY);

  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<ConsentPreferences>;

    if (parsed.necessary !== true || typeof parsed.analytics !== "boolean") {
      return null;
    }

    return {
      necessary: true,
      analytics: parsed.analytics,
    };
  } catch {
    return null;
  }
}

export function setConsent(value: ConsentValue): void {
  setConsentPreferences({
    necessary: true,
    analytics: value === "accepted",
  });
}

export function setConsentPreferences(preferences: ConsentPreferences): void {
  if (typeof document === "undefined") {
    return;
  }

  const secure = window.location.protocol === "https:" ? "; Secure" : "";

  document.cookie = [
    `${CONSENT_KEY}=${encodeURIComponent(
      preferences.analytics ? "accepted" : "rejected",
    )}`,
    "path=/",
    `max-age=${ONE_YEAR_SECONDS}`,
    "SameSite=Lax",
    secure.replace(/^;\s*/, ""),
  ]
    .filter(Boolean)
    .join("; ");

  document.cookie = [
    `${CONSENT_PREFERENCES_KEY}=${encodeURIComponent(
      JSON.stringify(preferences),
    )}`,
    "path=/",
    `max-age=${ONE_YEAR_SECONDS}`,
    "SameSite=Lax",
    secure.replace(/^;\s*/, ""),
  ]
    .filter(Boolean)
    .join("; ");
}

export function hasAnalyticsConsent(): boolean {
  return getConsentPreferences()?.analytics === true;
}
