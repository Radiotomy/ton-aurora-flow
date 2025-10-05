import { useEffect } from 'react';
import { monitoring } from '@/services/monitoringService';
import { useLocation } from 'react-router-dom';

/**
 * Hook to track page views automatically
 */
export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    monitoring.trackPageView(location.pathname);
  }, [location.pathname]);
};

/**
 * Hook to track performance metrics
 */
export const usePerformanceTracking = (metricName: string) => {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      monitoring.trackPerformance(metricName, duration);
    };
  }, [metricName]);
};

/**
 * Hook for easy access to monitoring functions
 */
export const useMonitoring = () => {
  return {
    trackEvent: monitoring.trackEvent.bind(monitoring),
    trackWalletConnection: monitoring.trackWalletConnection.bind(monitoring),
    trackNFTMint: monitoring.trackNFTMint.bind(monitoring),
    trackPayment: monitoring.trackPayment.bind(monitoring),
    trackSecurityEvent: monitoring.trackSecurityEvent.bind(monitoring),
    info: monitoring.info.bind(monitoring),
    warn: monitoring.warn.bind(monitoring),
    error: monitoring.error.bind(monitoring),
    critical: monitoring.critical.bind(monitoring),
  };
};
