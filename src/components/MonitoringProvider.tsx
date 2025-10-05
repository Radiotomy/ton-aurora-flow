import { useEffect } from 'react';
import { usePageTracking } from '@/hooks/useMonitoring';
import { monitoring } from '@/services/monitoringService';

interface MonitoringProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component to initialize monitoring and track page views
 */
export const MonitoringProvider = ({ children }: MonitoringProviderProps) => {
  // Track page views automatically
  usePageTracking();

  useEffect(() => {
    // Log app initialization
    monitoring.info('system', 'App Initialized', {
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      url: window.location.href,
    });

    // Track performance metrics
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      
      monitoring.trackPerformance('page_load', loadTime);
    }

    // Cleanup on unmount
    return () => {
      monitoring.destroy();
    };
  }, []);

  return <>{children}</>;
};
