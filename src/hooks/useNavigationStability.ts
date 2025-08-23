import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

interface NavigationStabilityOptions {
  debounceMs?: number;
  stabilityWindow?: number;
}

export const useNavigationStability = (options: NavigationStabilityOptions = {}) => {
  const { debounceMs = 300, stabilityWindow = 1000 } = options;
  const location = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);
  const navigationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocationRef = useRef(location.pathname);
  const stabilityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Detect navigation changes
  useEffect(() => {
    if (lastLocationRef.current !== location.pathname) {
      lastLocationRef.current = location.pathname;
      
      // Clear existing timers
      if (navigationTimerRef.current) {
        clearTimeout(navigationTimerRef.current);
      }
      if (stabilityTimerRef.current) {
        clearTimeout(stabilityTimerRef.current);
      }

      // Mark as navigating
      setIsNavigating(true);

      // Debounce navigation state
      navigationTimerRef.current = setTimeout(() => {
        setIsNavigating(false);
      }, debounceMs);

      // Additional stability window
      stabilityTimerRef.current = setTimeout(() => {
        setIsNavigating(false);
      }, stabilityWindow);
    }
  }, [location.pathname, debounceMs, stabilityWindow]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (navigationTimerRef.current) {
        clearTimeout(navigationTimerRef.current);
      }
      if (stabilityTimerRef.current) {
        clearTimeout(stabilityTimerRef.current);
      }
    };
  }, []);

  // Create stable callback that respects navigation state
  const createStableCallback = useCallback(
    <T extends (...args: any[]) => any>(callback: T): T => {
      return ((...args: any[]) => {
        if (!isNavigating) {
          return callback(...args);
        }
      }) as T;
    },
    [isNavigating]
  );

  return {
    isNavigating,
    isStable: !isNavigating,
    createStableCallback,
  };
};