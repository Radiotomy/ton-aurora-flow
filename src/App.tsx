import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TonConnectProvider } from "@/providers/TonConnectProvider";
import { AudioPlayer } from "@/components/AudioPlayer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ArtistDetail from "./pages/ArtistDetail";
import TrackDetail from "./pages/TrackDetail";
import NotFound from "./pages/NotFound";
import Navigation from "./components/Navigation";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <TonConnectProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <div className="min-h-screen bg-subtle pb-20">
            <BrowserRouter>
              <Navigation />
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/artist/:artistId" element={<ArtistDetail />} />
                  <Route path="/track/:trackId" element={<TrackDetail />} />
                  <Route path="/tracks" element={<Index />} />
                  <Route path="/fan-clubs" element={<Index />} />
                  <Route path="/creator-studio" element={<Index />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </ErrorBoundary>
              <ErrorBoundary>
                <AudioPlayer />
              </ErrorBoundary>
            </BrowserRouter>
          </div>
        </TooltipProvider>
      </TonConnectProvider>
    </ErrorBoundary>
  </QueryClientProvider>
);

export default App;
