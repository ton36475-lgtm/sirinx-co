import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import "./index.css";
import { installAnalyticsScript } from "./lib/analytics-loader";

installAnalyticsScript(document, {
  endpoint: import.meta.env.VITE_ANALYTICS_ENDPOINT,
  websiteId: import.meta.env.VITE_ANALYTICS_WEBSITE_ID,
});

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
