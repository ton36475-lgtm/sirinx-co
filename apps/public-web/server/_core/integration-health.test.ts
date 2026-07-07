import { afterEach, describe, expect, it } from "vitest";
import { getIntegrationHealth } from "./integration-health";

const originalAnalyticsEndpoint = process.env.VITE_ANALYTICS_ENDPOINT;
const originalAnalyticsWebsiteId = process.env.VITE_ANALYTICS_WEBSITE_ID;

afterEach(() => {
  if (originalAnalyticsEndpoint === undefined) {
    delete process.env.VITE_ANALYTICS_ENDPOINT;
  } else {
    process.env.VITE_ANALYTICS_ENDPOINT = originalAnalyticsEndpoint;
  }

  if (originalAnalyticsWebsiteId === undefined) {
    delete process.env.VITE_ANALYTICS_WEBSITE_ID;
  } else {
    process.env.VITE_ANALYTICS_WEBSITE_ID = originalAnalyticsWebsiteId;
  }
});

describe("integration health", () => {
  it("reports analytics as disabled when analytics env is intentionally absent", () => {
    delete process.env.VITE_ANALYTICS_ENDPOINT;
    delete process.env.VITE_ANALYTICS_WEBSITE_ID;

    const health = getIntegrationHealth({
      appId: "app-123",
      cookieSecret: "secret",
      oAuthServerUrl: "https://oauth.example.com",
      databaseUrl: "postgres://db",
      forgeApiKey: "forge-key",
      forgeApiUrl: "https://forge.example.com",
    });

    expect(health.analytics.status).toBe("disabled");
    expect(health.leadCapture.status).toBe("ready");
    expect(health.publicLeadCaptureReady).toBe(true);
    expect(health.chatbotFallback.status).toBe("ready");
    expect(health.publicChatbotReady).toBe(true);
    expect(health.localContinuationReady).toBe(true);
  });

  it("reports partial auth state when only some auth fields are configured", () => {
    const health = getIntegrationHealth({
      appId: "app-123",
      cookieSecret: "",
      oAuthServerUrl: "https://oauth.example.com",
      databaseUrl: "",
      forgeApiKey: "forge-key",
      forgeApiUrl: "",
    });

    expect(health.auth.status).toBe("partial");
    expect(health.auth.missingFields).toContain("cookieSecret");
    expect(health.database.status).toBe("not_configured");
    expect(health.leadCapture.status).toBe("partial");
    expect(health.leadCapture.configuredFields).toEqual(["localQueue"]);
    expect(health.publicLeadCaptureReady).toBe(true);
    expect(health.chatbot.status).toBe("ready");
    expect(health.publicChatbotReady).toBe(true);
  });

  it("keeps public chatbot available through static fallback without a Forge key", () => {
    const health = getIntegrationHealth({
      appId: "",
      cookieSecret: "",
      oAuthServerUrl: "",
      databaseUrl: "",
      forgeApiKey: "",
      forgeApiUrl: "",
    });

    expect(health.chatbot.status).toBe("not_configured");
    expect(health.chatbotFallback.status).toBe("ready");
    expect(health.publicChatbotReady).toBe(true);
  });

  it("reports analytics as partial when only one analytics field is configured", () => {
    process.env.VITE_ANALYTICS_ENDPOINT = "https://analytics.example.com";
    delete process.env.VITE_ANALYTICS_WEBSITE_ID;

    const health = getIntegrationHealth();

    expect(health.analytics.status).toBe("partial");
    expect(health.analytics.configuredFields).toContain("analyticsEndpoint");
    expect(health.analytics.missingFields).toContain("analyticsWebsiteId");
  });
});
