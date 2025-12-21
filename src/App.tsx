import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TonConnectProvider } from "@/providers/TonConnectProvider";
import { TonSitesRouter } from "@/components/TonSitesRouter";
import { AudioPlayer } from "@/components/AudioPlayer";
import { ErrorBoundaryWithTWA } from "@/components/ErrorBoundaryWithTWA";
import { SecurityProvider } from "@/components/SecurityProvider";
import { MonitoringProvider } from "@/components/MonitoringProvider";
import { ProfileSecurityCheck } from "@/components/ProfileSecurityCheck";
import { useTelegramWebApp } from "@/hooks/useTelegramWebApp";
import { analytics } from "@/utils/analytics";
import { useEffect, lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Eagerly loaded pages (critical path)
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Navigation from "./components/Navigation";
import { ScrollToTop } from "./components/ScrollToTop";
import Footer from "./components/Footer";

// Lazily loaded pages (non-critical)
const Discover = lazy(() => import("./pages/Discover"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Playlists = lazy(() => import("./pages/Playlists"));
const ArtistDetail = lazy(() => import("./pages/ArtistDetail"));
const TrackDetail = lazy(() => import("./pages/TrackDetail"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const NotFound = lazy(() => import("./pages/NotFound"));
const FanClubs = lazy(() => import("./pages/FanClubs"));
const CreatorStudio = lazy(() => import("./pages/CreatorStudio"));
const LiveEvents = lazy(() => import("./pages/LiveEvents"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const AudiusCallback = lazy(() => import("./pages/AudiusCallback"));
const MainnetDeploy = lazy(() => import("./pages/MainnetDeploy"));
const Deploy = lazy(() => import("./pages/Deploy"));
const Help = lazy(() => import("./pages/Help"));
const HelpFans = lazy(() => import("./pages/HelpFans"));
const HelpArtists = lazy(() => import("./pages/HelpArtists"));
const ContractValidation = lazy(() => import("./pages/ContractValidation").then(m => ({ default: m.ContractValidation })));
const Install = lazy(() => import("./pages/Install"));

// Page loading fallback
const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center p-4">
    <div className="w-full max-w-md space-y-4">
      <Skeleton className="h-8 w-3/4 mx-auto" />
      <Skeleton className="h-4 w-1/2 mx-auto" />
      <div className="grid grid-cols-2 gap-4 pt-4">
        <Skeleton className="aspect-square rounded-xl" />
        <Skeleton className="aspect-square rounded-xl" />
      </div>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const { isInTWA, colorScheme } = useTelegramWebApp();

  useEffect(() => {
    // Set theme based on Telegram Web App
    if (isInTWA) {
      document.documentElement.setAttribute('data-theme', colorScheme);
      // Safely track telegram event
      try {
        analytics.trackTelegramEvent('app_initialized');
      } catch (error) {
        console.warn('Failed to track telegram event:', error);
      }
    }
  }, [isInTWA, colorScheme]);

  return (
    <div className="min-h-screen bg-background pb-36 lg:pb-24">
      <ProfileSecurityCheck />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <MonitoringProvider>
          <ScrollToTop />
          <TonSitesRouter>
            <Navigation />
            <ErrorBoundaryWithTWA>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/discover" element={<Discover />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/auth/audius/callback" element={<AudiusCallback />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/playlists" element={<Playlists />} />
                  <Route path="/artist/:artistId" element={<ArtistDetail />} />
                  <Route path="/track/:trackId" element={<TrackDetail />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/tracks" element={<Index />} />
                  <Route path="/fan-clubs" element={<FanClubs />} />
                  <Route path="/creator-studio" element={<CreatorStudio />} />
                  <Route path="/live-events" element={<LiveEvents />} />
                  <Route path="/marketplace" element={<Marketplace />} />
                  <Route path="/deploy" element={<Deploy />} />
                  <Route path="/mainnet-deploy" element={<MainnetDeploy />} />
                  <Route path="/help" element={<Help />} />
                  <Route path="/help/fans" element={<HelpFans />} />
                  <Route path="/help/artists" element={<HelpArtists />} />
                  <Route path="/contracts/validate" element={<ContractValidation />} />
                  <Route path="/install" element={<Install />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ErrorBoundaryWithTWA>
            <ErrorBoundaryWithTWA>
              <AudioPlayer />
            </ErrorBoundaryWithTWA>
            <Footer />
          </TonSitesRouter>
        </MonitoringProvider>
      </BrowserRouter>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundaryWithTWA>
      <SecurityProvider>
        <TonConnectProvider>
          <TooltipProvider>
            <Toaster />
            <AppContent />
          </TooltipProvider>
        </TonConnectProvider>
      </SecurityProvider>
    </ErrorBoundaryWithTWA>
  </QueryClientProvider>
);

export default App;
