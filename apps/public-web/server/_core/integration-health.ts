import { ENV } from "./env";

type IntegrationStatus = "ready" | "not_configured" | "partial" | "disabled";

type IntegrationReadiness = {
  status: IntegrationStatus;
  configuredFields: string[];
  missingFields: string[];
};

const getConfiguredFields = (
  fields: Record<string, string>,
  options: { disabledIfEmpty?: boolean } = {}
): IntegrationReadiness => {
  const configuredFields = Object.entries(fields)
    .filter(([, value]) => value.length > 0)
    .map(([key]) => key);
  const missingFields = Object.entries(fields)
    .filter(([, value]) => value.length === 0)
    .map(([key]) => key);

  if (configuredFields.length === Object.keys(fields).length) {
    return { status: "ready", configuredFields, missingFields };
  }

  if (configuredFields.length === 0) {
    return {
      status: options.disabledIfEmpty ? "disabled" : "not_configured",
      configuredFields,
      missingFields,
    };
  }

  return { status: "partial", configuredFields, missingFields };
};

export const getIntegrationHealth = (
  overrides: Partial<typeof ENV> = {}
) => {
  const env = { ...ENV, ...overrides };
  const auth = getConfiguredFields({
    appId: env.appId,
    cookieSecret: env.cookieSecret,
    oAuthServerUrl: env.oAuthServerUrl,
  });
  const database = getConfiguredFields({
    databaseUrl: env.databaseUrl,
  });
  const leadCapture =
    database.status === "ready"
      ? {
          status: "ready" as const,
          configuredFields: ["databaseUrl"],
          missingFields: [],
        }
      : {
          status: "partial" as const,
          configuredFields: ["localQueue"],
          missingFields: ["databaseUrl"],
        };
  const analytics = getConfiguredFields(
    {
      analyticsEndpoint: process.env.VITE_ANALYTICS_ENDPOINT ?? "",
      analyticsWebsiteId: process.env.VITE_ANALYTICS_WEBSITE_ID ?? "",
    },
    { disabledIfEmpty: true }
  );
  const chatbot = getConfiguredFields({
    forgeApiKey: env.forgeApiKey,
  });
  const chatbotFallback = {
    status: "ready" as const,
    configuredFields: ["staticAssistant"],
    missingFields: [],
  };

  return {
    auth,
    database,
    leadCapture,
    analytics,
    chatbot,
    chatbotFallback,
    publicLeadCaptureReady: leadCapture.status === "ready" || leadCapture.status === "partial",
    publicChatbotReady: chatbot.status === "ready" || chatbotFallback.status === "ready",
    localContinuationReady:
      database.status === "ready" &&
      (analytics.status === "ready" || analytics.status === "disabled"),
  };
};
