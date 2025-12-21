/**
 * Secure logging utility that prevents sensitive information leakage in production
 * Only logs sanitized error messages in production builds
 */

const isDevelopment = import.meta.env.DEV;

// Fields that should never be logged
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'apiKey',
  'api_key',
  'authorization',
  'wallet_address',
  'private_key',
  'seed',
  'mnemonic',
];

/**
 * Sanitize error object to remove sensitive information
 */
function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    // In production, only return the error message, not the full stack
    return isDevelopment ? error.message : 'An error occurred';
  }
  
  if (typeof error === 'string') {
    // Check for sensitive patterns and redact them
    let sanitized = error;
    SENSITIVE_FIELDS.forEach(field => {
      const regex = new RegExp(`${field}[\\s]*[:=][\\s]*[^\\s,}]+`, 'gi');
      sanitized = sanitized.replace(regex, `${field}=[REDACTED]`);
    });
    return isDevelopment ? sanitized : 'An error occurred';
  }
  
  if (typeof error === 'object' && error !== null) {
    // In production, just indicate an error occurred
    if (!isDevelopment) {
      return 'An error occurred';
    }
    
    // In development, sanitize the object
    try {
      const obj = error as Record<string, unknown>;
      const sanitized: Record<string, unknown> = {};
      
      for (const [key, value] of Object.entries(obj)) {
        if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
          sanitized[key] = '[REDACTED]';
        } else if (typeof value === 'string') {
          let sanitizedValue = value;
          SENSITIVE_FIELDS.forEach(field => {
            const regex = new RegExp(`${field}[\\s]*[:=][\\s]*[^\\s,}]+`, 'gi');
            sanitizedValue = sanitizedValue.replace(regex, `${field}=[REDACTED]`);
          });
          sanitized[key] = sanitizedValue;
        } else {
          sanitized[key] = value;
        }
      }
      
      return JSON.stringify(sanitized);
    } catch {
      return 'An error occurred';
    }
  }
  
  return 'An error occurred';
}

/**
 * Log error securely - only logs detailed info in development
 */
export function logError(context: string, error: unknown): void {
  if (isDevelopment) {
    console.error(`[${context}]`, error);
  } else {
    // In production, log minimal sanitized information
    console.error(`[${context}]`, sanitizeError(error));
  }
}

/**
 * Log warning securely
 */
export function logWarn(context: string, message: string): void {
  if (isDevelopment) {
    console.warn(`[${context}]`, message);
  }
  // In production, warnings are suppressed to avoid information leakage
}

/**
 * Log info securely - only in development
 */
export function logInfo(context: string, message: string): void {
  if (isDevelopment) {
    console.info(`[${context}]`, message);
  }
}

/**
 * Log debug info - only in development
 */
export function logDebug(context: string, data: unknown): void {
  if (isDevelopment) {
    console.debug(`[${context}]`, data);
  }
}

export const secureLogger = {
  error: logError,
  warn: logWarn,
  info: logInfo,
  debug: logDebug,
};
