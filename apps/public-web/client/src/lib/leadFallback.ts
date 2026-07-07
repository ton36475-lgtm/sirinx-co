export type LeadFallbackFormData = {
  name: string;
  company?: string;
  email?: string;
  phone: string;
  interest: string;
  budget?: string;
  timeline?: string;
  monthlyBill?: string;
  roofArea?: string;
  message?: string;
};

const FALLBACK_EMAIL = "pitoon.sirinx@gmail.com";

const clean = (value: string | undefined) => value?.trim() || "-";

export function buildLeadFallbackSummary(
  data: LeadFallbackFormData,
  submittedAt: Date = new Date()
) {
  return [
    "SIRINX quote request fallback",
    `Submitted at: ${submittedAt.toISOString()}`,
    "Source: www.sirinx.co/contact",
    "",
    `Name: ${clean(data.name)}`,
    `Company: ${clean(data.company)}`,
    `Phone: ${clean(data.phone)}`,
    `Email: ${clean(data.email)}`,
    `Interest: ${clean(data.interest)}`,
    `Budget: ${clean(data.budget)}`,
    `Timeline: ${clean(data.timeline)}`,
    `Monthly bill: ${clean(data.monthlyBill)} THB`,
    `Roof area: ${clean(data.roofArea)} sq.m.`,
    "",
    "Message:",
    clean(data.message),
  ].join("\n");
}

export function buildLeadFallbackMailto(
  data: LeadFallbackFormData,
  submittedAt: Date = new Date()
) {
  const subject = `SIRINX quote request - ${clean(data.name)}`;
  const body = buildLeadFallbackSummary(data, submittedAt);
  return `mailto:${FALLBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function isLeadTransportFallbackError(error: unknown) {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message?: unknown }).message ?? "")
      : String(error ?? "");

  return /failed to fetch|unexpected end of json|method not allowed|cannot post|service unavailable|database binding|status code 405|status code 503|\b405\b|\b503\b/i.test(
    message
  );
}
