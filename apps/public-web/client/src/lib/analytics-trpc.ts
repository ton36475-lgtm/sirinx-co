import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "../../../server/routers";

type PageViewInput = {
  deviceType: string;
  path: string;
  referrer?: string;
  sessionId: string;
  utmCampaign?: string;
  utmMedium?: string;
  utmSource?: string;
  visitorId: string;
};

type EventInput = {
  action: string;
  category: string;
  label?: string;
  metadata?: string;
  pagePath: string;
  sessionId: string;
  value?: number;
  visitorId: string;
};

const analyticsClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

export const trackPageView = (input: PageViewInput) =>
  analyticsClient.analytics.trackPageView.mutate(input);

export const trackEvent = (input: EventInput) =>
  analyticsClient.analytics.trackEvent.mutate(input);
