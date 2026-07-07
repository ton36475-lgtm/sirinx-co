type AnalyticsDocument = Pick<Document, "body" | "createElement" | "querySelector">;

export const normalizeAnalyticsEndpoint = (endpoint: string) =>
  endpoint.replace(/\/+$/, "");

export const isAnalyticsConfigured = (
  endpoint?: string,
  websiteId?: string
): endpoint is string =>
  typeof endpoint === "string" &&
  endpoint.length > 0 &&
  typeof websiteId === "string" &&
  websiteId.length > 0;

export const installAnalyticsScript = (
  doc: AnalyticsDocument,
  options: {
    endpoint?: string;
    websiteId?: string;
  }
) => {
  const { endpoint, websiteId } = options;

  if (!isAnalyticsConfigured(endpoint, websiteId)) {
    return false;
  }

  const existingScript = doc.querySelector("script[data-sirinx-analytics='umami']");
  if (existingScript) {
    return false;
  }

  const script = doc.createElement("script");
  script.defer = true;
  script.src = `${normalizeAnalyticsEndpoint(endpoint)}/umami`;
  script.dataset.websiteId = websiteId;
  script.dataset.sirinxAnalytics = "umami";

  doc.body.appendChild(script);
  return true;
};
