import { Route, Switch } from "wouter";
import { Suspense, lazy, useEffect, useState } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Layout from "./components/Layout";
import RouteSeo from "./components/RouteSeo";
import { usePageViewTracking } from "@/hooks/useAnalytics";
import AntiCopy from "./components/AntiCopy";
import AILiveAvatarMark from "./components/AILiveAvatarMark";

const NotFound = lazy(() => import("@/pages/NotFound"));
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Solutions = lazy(() => import("./pages/Solutions"));
const HomeSolution = lazy(() => import("./pages/HomeSolution"));
const Industries = lazy(() => import("./pages/Industries"));
const InvestmentTaxHub = lazy(() => import("./pages/InvestmentTaxHub"));
const Projects = lazy(() => import("./pages/Projects"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Contact = lazy(() => import("./pages/Contact"));
const SolarAssessment = lazy(() => import("./pages/SolarAssessment"));
const Partner = lazy(() => import("./pages/Partner"));
const Strategy = lazy(() => import("./pages/Strategy"));
const SolarCarport = lazy(() => import("./pages/SolarCarport"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Cookies = lazy(() => import("./pages/Cookies"));
const DashboardLayout = lazy(() => import("./components/DashboardLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminLeads = lazy(() => import("./pages/admin/Leads"));
const AdminBlogCMS = lazy(() => import("./pages/admin/BlogCMS"));
const AdminContactSubmissions = lazy(
  () => import("./pages/admin/ContactSubmissions")
);
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));
const AdminAgentMonitor = lazy(() => import("./pages/admin/AgentMonitor"));
const FloatingChatWidget = lazy(
  () => import("./components/FloatingChatWidget")
);
const Toaster = lazy(() =>
  import("@/components/ui/sonner").then(module => ({ default: module.Toaster }))
);

function RouteFallback() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-accent-primary/30 border-t-accent-primary animate-spin" />
      </div>
    </div>
  );
}

function DeferredFloatingChatWidget() {
  const [shouldLoad, setShouldLoad] = useState(false);

  if (!shouldLoad) {
    return (
      <button
        type="button"
        aria-label="เปิดแชท SIRINX Solar Assistant"
        className="sirinx-live-avatar-trigger fixed right-4 bottom-5 z-50 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full shadow-2xl sm:right-6 sm:bottom-6"
        style={{
          background:
            "linear-gradient(135deg, #06b6d4 0%, #0d9488 50%, #00C300 100%)",
        }}
        onClick={() => setShouldLoad(true)}
      >
        <span className="absolute inset-0 rounded-full bg-cyan-400 opacity-20 animate-ping" />
        <span className="sirinx-live-avatar-orbit sirinx-live-avatar-orbit-a" />
        <span className="sirinx-live-avatar-orbit sirinx-live-avatar-orbit-b" />
        <span className="sirinx-live-avatar-trail sirinx-live-avatar-trail-a" />
        <span className="sirinx-live-avatar-trail sirinx-live-avatar-trail-b" />
        <span className="absolute inset-1 rounded-full bg-gradient-to-br from-cyan-400/30 to-green-400/30" />
        <span className="sirinx-live-avatar-core relative flex items-center justify-center">
          <AILiveAvatarMark className="h-14 w-14 drop-shadow-md" />
        </span>
        <span className="absolute -top-0.5 -right-0.5 z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#00C300] text-[9px] font-bold text-white shadow-md">
          AI
        </span>
      </button>
    );
  }

  return (
    <Suspense fallback={null}>
      <FloatingChatWidget initialOpen />
    </Suspense>
  );
}

function DeferredToaster() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (shouldLoad) return;

    const reveal = () => setShouldLoad(true);
    const events: Array<keyof WindowEventMap> = [
      "pointerdown",
      "keydown",
      "touchstart",
    ];

    for (const event of events) {
      window.addEventListener(event, reveal, { once: true, passive: true });
    }

    return () => {
      for (const event of events) {
        window.removeEventListener(event, reveal);
      }
    };
  }, [shouldLoad]);

  if (!shouldLoad) return null;

  return (
    <Suspense fallback={null}>
      <Toaster />
    </Suspense>
  );
}

function PublicRouter() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/about" component={About} />
        <Route path="/solar-carport/:province" component={SolarCarport} />
        <Route path="/solar-carport" component={SolarCarport} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/solutions" component={Solutions} />
        <Route path="/home-solution" component={HomeSolution} />
        <Route path="/industries" component={Industries} />
        <Route path="/investment" component={InvestmentTaxHub} />
        <Route path="/projects" component={Projects} />
        <Route path="/strategy" component={Strategy} />
        <Route path="/blog" component={Blog} />
        <Route path="/blog/:slug" component={BlogPost} />
        <Route path="/contact" component={Contact} />
        <Route path="/assessment" component={SolarAssessment} />
        <Route path="/partner" component={Partner} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/terms" component={Terms} />
        <Route path="/cookies" component={Cookies} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function AdminRouter() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/leads" component={AdminLeads} />
        <Route path="/admin/blog" component={AdminBlogCMS} />
        <Route path="/admin/contacts" component={AdminContactSubmissions} />
        <Route path="/admin/analytics" component={AdminAnalytics} />
        <Route path="/admin/agent-monitor" component={AdminAgentMonitor} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function isInternalHost() {
  if (typeof window === "undefined") return false;

  const hostname = window.location.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1"
  )
    return true;
  if (hostname === "dev.sirinx.co") return true;
  if (/^10\./.test(hostname) || /^192\.168\./.test(hostname)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)) return true;

  return false;
}

function Router() {
  const internalRoutesEnabled = isInternalHost();

  return (
    <Switch>
      {internalRoutesEnabled ? (
        <Route path="/admin/:rest*" component={AdminRouter} />
      ) : null}
      {internalRoutesEnabled ? (
        <Route path="/admin" component={AdminRouter} />
      ) : null}
      {!internalRoutesEnabled ? (
        <Route path="/admin/:rest*" component={NotFound} />
      ) : null}
      {!internalRoutesEnabled ? (
        <Route path="/admin" component={NotFound} />
      ) : null}
      <Route component={PublicRouter} />
    </Switch>
  );
}

function PageViewTracker() {
  usePageViewTracking();
  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider defaultTheme="dark" switchable>
          <DeferredToaster />
          <RouteSeo />
          <PageViewTracker />
          <AntiCopy enabled={import.meta.env.PROD} />
          <Suspense fallback={<RouteFallback />}>
            <Router />
          </Suspense>
          <DeferredFloatingChatWidget />
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
