// Error suppression utilities to reduce console noise from third-party scripts

/**
 * Suppress specific console errors that are from third-party libraries
 * and don't affect app functionality
 */
export const suppressThirdPartyErrors = () => {
  if (typeof window === 'undefined') return;

  // Store original console methods
  const originalError = console.error;
  const originalWarn = console.warn;

  // List of error patterns to suppress
  const suppressedPatterns = [
    /Failed to execute 'postMessage' on 'DOMWindow'/,
    /The target origin provided .* does not match the recipient window's origin/,
    /Non-Error promise rejection captured/,
  ];

  // Override console.error to filter out suppressed errors
  console.error = (...args) => {
    const message = args.join(' ');
    
    // Check if this error should be suppressed
    const shouldSuppress = suppressedPatterns.some(pattern => 
      pattern.test(message)
    );
    
    if (!shouldSuppress) {
      originalError.apply(console, args);
    }
  };

  // Override console.warn for warning patterns
  console.warn = (...args) => {
    const message = args.join(' ');
    
    // Allow through all warnings for now, but could filter here too
    originalWarn.apply(console, args);
  };
};

/**
 * Add global error handlers for unhandled promise rejections
 * and cross-origin errors that we can't control
 */
export const setupGlobalErrorHandlers = () => {
  if (typeof window === 'undefined') return;

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    // Suppress postMessage related promise rejections
    if (event.reason && typeof event.reason === 'object') {
      const reason = event.reason.toString();
      if (reason.includes('postMessage') || reason.includes('target origin')) {
        event.preventDefault();
        return;
      }
    }
  });

  // Handle cross-origin errors
  window.addEventListener('error', (event) => {
    // Suppress cross-origin script errors that we can't control
    if (event.message?.includes('Script error') || event.message?.includes('postMessage')) {
      event.preventDefault();
      return;
    }
  });
};