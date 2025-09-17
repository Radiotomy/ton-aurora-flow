import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.082eb0ee579e46a8a35f2d335fe4e344',
  appName: 'ton-aurora-flow',
  webDir: 'dist',
  server: {
    url: "https://082eb0ee-579e-46a8-a35f-2d335fe4e344.lovableproject.com?forceHideBadge=true",
    cleartext: true,
    // TON Sites support configuration
    allowNavigation: [
      "https://082eb0ee-579e-46a8-a35f-2d335fe4e344.lovableproject.com",
      "https://audioton.lovable.app",
      "https://audioton.ton",
      "*.ton" // Allow all TON domains
    ]
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    // Enhanced for TON Sites compatibility
    App: {
      launchUrl: "https://082eb0ee-579e-46a8-a35f-2d335fe4e344.lovableproject.com"
    }
  },
};

export default config;