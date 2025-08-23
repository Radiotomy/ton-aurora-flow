import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TonConnectProvider } from "@/providers/TonConnectProvider";
import { AudioPlayer } from "@/components/AudioPlayer";
import { ErrorBoundaryWithTWA } from "@/components/ErrorBoundaryWithTWA";
import { useTelegramWebApp } from "@/hooks/useTelegramWebApp";
import { analytics } from "@/utils/analytics";
import { useEffect } from "react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Playlists from "./pages/Playlists";
import ArtistDetail from "./pages/ArtistDetail";
import TrackDetail from "./pages/TrackDetail";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import FanClubs from "./pages/FanClubs";
import CreatorStudio from "./pages/CreatorStudio";
import LiveEvents from "./pages/LiveEvents";
import AudiusCallback from "./pages/AudiusCallback";
import Navigation from "./components/Navigation";

const queryClient = new QueryClient();

function AppContent() {
  const { isInTWA, colorScheme } = useTelegramWebApp();

  useEffect(() => {
    // Set theme based on Telegram Web App
    if (isInTWA) {
      document.documentElement.setAttribute('data-theme', colorScheme);
      analytics.trackTelegramEvent('app_initialized');
    }
  }, [isInTWA, colorScheme]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <Navigation />
        <ErrorBoundaryWithTWA>
          <Routes>
            <Route path="/" element={<Index />} />
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundaryWithTWA>
        <ErrorBoundaryWithTWA>
          <AudioPlayer />
        </ErrorBoundaryWithTWA>
      </BrowserRouter>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundaryWithTWA>
      <TonConnectProvider>
        <TooltipProvider>
          <Toaster />
          <AppContent />
        </TooltipProvider>
      </TonConnectProvider>
    </ErrorBoundaryWithTWA>
  </QueryClientProvider>
);

export default App;
