import { useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";

const API_ANALYTICS_ENABLED = import.meta.env.VITE_ENABLE_API_ANALYTICS === "true";

// ==================== VISITOR & SESSION ID ====================

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function getVisitorId(): string {
  const key = "sirinx_vid";
  let vid = localStorage.getItem(key);
  if (!vid) {
    vid = generateId();
    localStorage.setItem(key, vid);
  }
  return vid;
}

function getSessionId(): string {
  const key = "sirinx_sid";
  const expKey = "sirinx_sid_exp";
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  let sid = sessionStorage.getItem(key);
  const expStr = sessionStorage.getItem(expKey);
  const now = Date.now();

  if (!sid || !expStr || now > parseInt(expStr, 10)) {
    sid = generateId();
    sessionStorage.setItem(key, sid);
  }
  sessionStorage.setItem(expKey, String(now + SESSION_TIMEOUT));
  return sid;
}

function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return "mobile";
  return "desktop";
}

function getUTMParams(): { utmSource?: string; utmMedium?: string; utmCampaign?: string } {
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get("utm_source") || undefined,
    utmMedium: params.get("utm_medium") || undefined,
    utmCampaign: params.get("utm_campaign") || undefined,
  };
}

function isTrpcAnalyticsEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_TRPC_ANALYTICS === "true";
}

function isAnalyticsEnabled(): boolean {
  return API_ANALYTICS_ENABLED || isTrpcAnalyticsEnabled();
}

// ==================== PAGE VIEW TRACKING HOOK ====================

/**
 * Auto-tracks page views on every route change.
 * Place this once in your App.tsx or Layout component.
 */
export function usePageViewTracking() {
  const [location] = useLocation();
  const lastTrackedPath = useRef<string>("");

  useEffect(() => {
    if (!isAnalyticsEnabled()) return;

    // Avoid duplicate tracking for same path
    if (location === lastTrackedPath.current) return;
    lastTrackedPath.current = location;

    const utm = getUTMParams();

    const payload = {
      path: location,
      referrer: document.referrer || undefined,
      visitorId: getVisitorId(),
      sessionId: getSessionId(),
      deviceType: getDeviceType(),
      ...utm,
    };

    void import("@/lib/analytics-trpc")
      .then(({ trackPageView }) => trackPageView(payload))
      .catch(error => console.error("[Analytics Page View Error]", error));
  }, [location]);
}

// ==================== EVENT TRACKING UTILITY ====================

/**
 * Returns a trackEvent function that can be called from any component.
 * Usage:
 *   const { trackEvent } = useEventTracking();
 *   trackEvent("cta_click", "hero_cta", { label: "นัดสำรวจหน้างานฟรี" });
 */
export function useEventTracking() {
  const trackEvent = useCallback(
    (
      category: string,
      action: string,
      opts?: { label?: string; value?: number; metadata?: Record<string, any> }
    ) => {
      if (!isAnalyticsEnabled()) return;

      const payload = {
        category,
        action,
        label: opts?.label,
        value: opts?.value,
        pagePath: window.location.pathname,
        visitorId: getVisitorId(),
        sessionId: getSessionId(),
        metadata: opts?.metadata ? JSON.stringify(opts.metadata) : undefined,
      };

      void import("@/lib/analytics-trpc")
        .then(({ trackEvent }) => trackEvent(payload))
        .catch(error => console.error("[Analytics Event Error]", error));
    },
    []
  );

  return { trackEvent };
}

// ==================== PRE-BUILT EVENT HELPERS ====================

/**
 * Track CTA button clicks.
 */
export function useTrackCTA() {
  const { trackEvent } = useEventTracking();

  return useCallback(
    (buttonName: string, section?: string) => {
      trackEvent("cta_click", buttonName, {
        label: section || window.location.pathname,
      });
    },
    [trackEvent]
  );
}

/**
 * Track form submissions.
 */
export function useTrackFormSubmit() {
  const { trackEvent } = useEventTracking();

  return useCallback(
    (formName: string, fieldsCount?: number) => {
      trackEvent("form_submit", formName, {
        value: fieldsCount,
        label: window.location.pathname,
      });
    },
    [trackEvent]
  );
}

/**
 * Track LINE OA clicks.
 */
export function useTrackLINEClick() {
  const { trackEvent } = useEventTracking();

  return useCallback(
    (source?: string) => {
      trackEvent("line_click", "line_oa_open", {
        label: source || window.location.pathname,
      });
    },
    [trackEvent]
  );
}
