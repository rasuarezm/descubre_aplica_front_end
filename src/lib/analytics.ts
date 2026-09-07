const UTM_STORAGE_KEY = "bidtory_utm";
const UTM_ATTRIBUTED_KEY = "bidtory_utm_attributed";

export type UtmAttribution = {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function canTrack(): boolean {
  return typeof window !== "undefined" && typeof window.gtag === "function";
}

export function getStoredUtm(): UtmAttribution | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(UTM_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<UtmAttribution>;
    if (!parsed.utm_source) return null;
    return {
      utm_source: parsed.utm_source,
      utm_medium: parsed.utm_medium || "",
      utm_campaign: parsed.utm_campaign || "",
    };
  } catch {
    return null;
  }
}

export function trackEvent(
  eventName: string,
  params: Record<string, string | number | boolean | undefined> = {},
): void {
  if (!canTrack()) return;
  const utm = getStoredUtm();
  window.gtag?.("event", eventName, {
    ...params,
    ...(utm
      ? {
          utm_source: utm.utm_source,
          utm_medium: utm.utm_medium,
          utm_campaign: utm.utm_campaign,
        }
      : {}),
  });
}

/** Persists inbound UTM for the session (no consent required — it is already in the URL). */
export function captureUtmFromSearchParams(searchParams: URLSearchParams): void {
  if (typeof window === "undefined") return;

  const source = searchParams.get("utm_source");
  if (!source) return;

  const payload: UtmAttribution = {
    utm_source: source,
    utm_medium: searchParams.get("utm_medium") || "",
    utm_campaign: searchParams.get("utm_campaign") || "",
  };
  sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(payload));
}

/** Fires purocontenido_inbound once per session after analytics consent. */
export function trackPurocontenidoInboundIfNeeded(): void {
  if (typeof window === "undefined") return;
  if (sessionStorage.getItem(UTM_ATTRIBUTED_KEY) === "1") return;

  const utm = getStoredUtm();
  if (!utm || utm.utm_source.toLowerCase() !== "purocontenido") return;

  sessionStorage.setItem(UTM_ATTRIBUTED_KEY, "1");
  trackEvent("purocontenido_inbound", {
    utm_medium: utm.utm_medium,
    utm_campaign: utm.utm_campaign,
  });
}
