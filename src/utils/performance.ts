// Performance utilities to reduce setTimeout violations and forced reflows

let rafId: number | null = null;

/**
 * Request animation frame wrapper that batches updates
 */
export const batchUpdates = (callback: () => void) => {
  if (rafId) {
    cancelAnimationFrame(rafId);
  }
  
  rafId = requestAnimationFrame(() => {
    callback();
    rafId = null;
  });
};

/**
 * Throttle function that uses requestAnimationFrame for smooth performance
 */
export const throttleRAF = <T extends (...args: any[]) => void>(
  func: T,
  delay: number = 16 // ~60fps
): T => {
  let lastTime = 0;
  let timeoutId: NodeJS.Timeout | null = null;
  
  return ((...args: any[]) => {
    const now = Date.now();
    
    if (now - lastTime >= delay) {
      lastTime = now;
      func(...args);
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        lastTime = Date.now();
        func(...args);
        timeoutId = null;
      }, delay - (now - lastTime));
    }
  }) as T;
};

/**
 * Debounce function optimized for performance
 */
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): T => {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return ((...args: any[]) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  }) as T;
};

/**
 * Optimize DOM measurements to prevent forced reflows
 */
export const measureDOM = (element: HTMLElement, properties: string[]): Record<string, number> => {
  const measurements: Record<string, number> = {};
  
  // Batch all reads together to prevent layout thrashing
  batchUpdates(() => {
    const computedStyle = window.getComputedStyle(element);
    
    properties.forEach(prop => {
      if (prop === 'width') {
        measurements[prop] = element.offsetWidth;
      } else if (prop === 'height') {
        measurements[prop] = element.offsetHeight;
      } else if (prop === 'top') {
        measurements[prop] = element.offsetTop;
      } else if (prop === 'left') {
        measurements[prop] = element.offsetLeft;
      } else {
        measurements[prop] = parseFloat(computedStyle.getPropertyValue(prop)) || 0;
      }
    });
  });
  
  return measurements;
};