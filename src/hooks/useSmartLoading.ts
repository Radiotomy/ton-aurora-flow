import { useState, useEffect, useCallback, useRef } from 'react';

interface LoadingPriority {
  essential: string[];     // Must load immediately
  important: string[];     // Load after essential
  optional: string[];      // Load when user is active/visible
}

interface SmartLoadingConfig {
  visibilityCheck: boolean;
  userActivityDelay: number;
  backgroundRefreshInterval: number;
  retryAttempts: number;
}

const DEFAULT_CONFIG: SmartLoadingConfig = {
  visibilityCheck: true,
  userActivityDelay: 2000,
  backgroundRefreshInterval: 30000,
  retryAttempts: 3,
};

export const useSmartLoading = (
  priorities: LoadingPriority,
  config: Partial<SmartLoadingConfig> = {}
) => {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [loadedData, setLoadedData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const userActiveRef = useRef(true);
  const lastActivityRef = useRef(Date.now());
  const loadersRef = useRef<Record<string, () => Promise<any>>>({});
  const retryCountRef = useRef<Record<string, number>>({});

  // Track user activity
  useEffect(() => {
    const updateActivity = () => {
      userActiveRef.current = true;
      lastActivityRef.current = Date.now();
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    // Check activity periodically
    const activityInterval = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      userActiveRef.current = timeSinceActivity < fullConfig.userActivityDelay;
    }, 1000);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
      clearInterval(activityInterval);
    };
  }, [fullConfig.userActivityDelay]);

  // Page visibility API
  const [isVisible, setIsVisible] = useState(!document.hidden);
  useEffect(() => {
    if (!fullConfig.visibilityCheck) return;

    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fullConfig.visibilityCheck]);

  const registerLoader = useCallback((key: string, loader: () => Promise<any>) => {
    loadersRef.current[key] = loader;
    retryCountRef.current[key] = 0;
  }, []);

  const loadData = useCallback(async (key: string, force = false) => {
    const loader = loadersRef.current[key];
    if (!loader) return;

    // Skip if not visible and not forced
    if (!force && fullConfig.visibilityCheck && !isVisible) return;

    // Skip optional loads if user is inactive
    if (!force && priorities.optional.includes(key) && !userActiveRef.current) return;

    setLoadingStates(prev => ({ ...prev, [key]: true }));
    setErrors(prev => ({ ...prev, [key]: '' }));

    try {
      const data = await loader();
      setLoadedData(prev => ({ ...prev, [key]: data }));
      retryCountRef.current[key] = 0; // Reset retry count on success
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Load failed';
      setErrors(prev => ({ ...prev, [key]: errorMessage }));
      
      // Retry logic
      const currentRetries = retryCountRef.current[key] || 0;
      if (currentRetries < fullConfig.retryAttempts) {
        retryCountRef.current[key] = currentRetries + 1;
        const delay = Math.pow(2, currentRetries) * 1000; // Exponential backoff
        setTimeout(() => loadData(key, force), delay);
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, [key]: false }));
    }
  }, [priorities, fullConfig, isVisible]);

  const loadByPriority = useCallback(async () => {
    // Load essential data immediately
    await Promise.all(priorities.essential.map(key => loadData(key, true)));
    
    // Load important data with small delay
    setTimeout(() => {
      priorities.important.forEach(key => loadData(key));
    }, 100);
    
    // Load optional data when user is active
    if (userActiveRef.current) {
      setTimeout(() => {
        priorities.optional.forEach(key => loadData(key));
      }, 500);
    }
  }, [priorities, loadData]);

  const refreshData = useCallback((keys?: string[]) => {
    const keysToRefresh = keys || [...priorities.essential, ...priorities.important];
    keysToRefresh.forEach(key => loadData(key, true));
  }, [priorities, loadData]);

  // Background refresh for essential data
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      if (userActiveRef.current) {
        priorities.essential.forEach(key => loadData(key));
      }
    }, fullConfig.backgroundRefreshInterval);

    return () => clearInterval(interval);
  }, [priorities.essential, loadData, fullConfig.backgroundRefreshInterval, isVisible]);

  return {
    loadingStates,
    loadedData,
    errors,
    registerLoader,
    loadData,
    loadByPriority,
    refreshData,
    isUserActive: userActiveRef.current,
    isVisible,
    retryCount: retryCountRef.current,
  };
};