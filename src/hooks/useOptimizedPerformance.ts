import { useCallback, useMemo, useRef, useEffect, useState } from 'react';

// Debounce hook for performance optimization
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
};

// Throttle hook for performance optimization  
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastRan = useRef<number>(0);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      
      if (now - lastRan.current >= delay) {
        callback(...args);
        lastRan.current = now;
      }
    }) as T,
    [callback, delay]
  );
};

// Intersection Observer for lazy loading
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const targetRef = useRef<HTMLElement>(null);
  const observerRef = useRef<IntersectionObserver>();
  
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observerRef.current.observe(target);

    return () => {
      if (observerRef.current && target) {
        observerRef.current.unobserve(target);
      }
    };
  }, []);

  return { targetRef, isIntersecting };
};

// Memoized calculation hook
export const useMemoizedCalculation = <T>(
  calculation: () => T,
  dependencies: any[]
): T => {
  return useMemo(calculation, dependencies);
};

// Performance monitoring hook
export const usePerformanceMonitor = (componentName: string) => {
  const renderCount = useRef(0);
  const startTime = useRef<number>();

  useEffect(() => {
    renderCount.current += 1;
    startTime.current = performance.now();
    
    return () => {
      if (startTime.current) {
        const renderTime = performance.now() - startTime.current;
        if (renderTime > 16) { // Flag slow renders (>16ms)
          console.warn(`${componentName} slow render: ${renderTime.toFixed(2)}ms (render #${renderCount.current})`);
        }
      }
    };
  });

  return renderCount.current;
};

// Optimized event handler hook
export const useOptimizedEventHandler = <T extends Event>(
  handler: (event: T) => void,
  dependencies: any[] = []
) => {
  return useCallback(handler, dependencies);
};