interface AnalyticsEvent {
  name: string;
  parameters?: Record<string, any>;
  user_id?: string;
  timestamp?: number;
}

interface UserProperties {
  wallet_address?: string;
  user_id?: string;
  platform?: string;
  version?: string;
}

class AnalyticsService {
  private isInitialized = false;
  private userId: string | null = null;
  private sessionId = this.generateSessionId();

  constructor() {
    this.initialize();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initialize() {
    if (typeof window === 'undefined') return;

    // Initialize Google Analytics if gtag is available
    if ((window as any).gtag) {
      this.isInitialized = true;
      console.log('Analytics initialized with Google Analytics');
    }

    // Initialize Telegram Analytics if in TWA
    if ((window as any).Telegram?.WebApp) {
      console.log('Analytics initialized for Telegram Web App');
    }

    // Track initial page view
    this.trackPageView(window.location.pathname);
  }

  setUserId(userId: string) {
    this.userId = userId;
    
    if ((window as any).gtag) {
      (window as any).gtag('config', 'GA_MEASUREMENT_ID', {
        user_id: userId
      });
    }
  }

  setUserProperties(properties: UserProperties) {
    if ((window as any).gtag) {
      (window as any).gtag('set', 'user_properties', properties);
    }
  }

  trackEvent(eventName: string, parameters: Record<string, any> = {}) {
    const event: AnalyticsEvent = {
      name: eventName,
      parameters: {
        ...parameters,
        session_id: this.sessionId,
        timestamp: Date.now(),
        user_agent: navigator.userAgent,
        referrer: document.referrer,
      },
      user_id: this.userId || undefined,
      timestamp: Date.now(),
    };

    // Google Analytics
    if ((window as any).gtag) {
      (window as any).gtag('event', eventName, event.parameters);
    }

    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', event);
    }

    // Send to custom analytics endpoint (if available)
    this.sendToCustomEndpoint(event);
  }

  trackPageView(path: string, title?: string) {
    this.trackEvent('page_view', {
      page_path: path,
      page_title: title || document.title,
    });
  }

  // Web3 specific tracking methods
  trackWalletConnection(walletType: string, address: string) {
    this.trackEvent('wallet_connected', {
      wallet_type: walletType,
      wallet_address: address.slice(0, 8) + '...' + address.slice(-4), // Privacy-friendly
    });
  }

  trackTransaction(type: string, amount?: number, currency?: string) {
    this.trackEvent('transaction', {
      transaction_type: type,
      amount: amount,
      currency: currency,
    });
  }

  trackMusicInteraction(action: string, trackId: string, artistId?: string) {
    this.trackEvent('music_interaction', {
      action,
      track_id: trackId,
      artist_id: artistId,
    });
  }

  trackNFTInteraction(action: string, nftId?: string, price?: number) {
    this.trackEvent('nft_interaction', {
      action,
      nft_id: nftId,
      price,
    });
  }

  trackError(error: Error, context?: string) {
    this.trackEvent('error', {
      error_message: error.message,
      error_stack: error.stack?.slice(0, 500), // Truncate for privacy
      context,
    });
  }

  trackPerformance(metric: string, value: number, unit: string = 'ms') {
    this.trackEvent('performance', {
      metric,
      value,
      unit,
    });
  }

  private async sendToCustomEndpoint(event: AnalyticsEvent) {
    try {
      // Only send to custom endpoint in production
      if (process.env.NODE_ENV !== 'production') return;

      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      // Silently fail to avoid breaking the app
      console.warn('Failed to send analytics event:', error);
    }
  }

  // Telegram Web App specific methods
  trackTelegramEvent(eventName: string, parameters: Record<string, any> = {}) {
    if ((window as any).Telegram?.WebApp) {
      const webApp = (window as any).Telegram.WebApp;
      
      this.trackEvent(`twa_${eventName}`, {
        ...parameters,
        platform: webApp.platform,
        version: webApp.version,
        viewport_height: webApp.viewportHeight,
        color_scheme: webApp.colorScheme,
      });
    }
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();

// Export individual tracking functions for convenience
export const {
  setUserId,
  setUserProperties,
  trackEvent,
  trackPageView,
  trackWalletConnection,
  trackTransaction,
  trackMusicInteraction,
  trackNFTInteraction,
  trackError,
  trackPerformance,
  trackTelegramEvent,
} = analytics;