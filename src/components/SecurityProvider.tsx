import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface SecurityProviderProps {
  children: React.ReactNode;
}

interface SecurityState {
  isSecure: boolean;
  warnings: string[];
}

/**
 * Security provider that implements basic security measures
 * for production deployment
 */
export const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  const [securityState, setSecurityState] = useState<SecurityState>({
    isSecure: true,
    warnings: []
  });
  const { toast } = useToast();

  useEffect(() => {
    const warnings: string[] = [];
    
    // Check if running on HTTPS in production
    if (process.env.NODE_ENV === 'production' && window.location.protocol !== 'https:') {
      warnings.push('Application should use HTTPS in production');
    }
    
    // Check for development tools in production
    if (process.env.NODE_ENV === 'production') {
      // Disable right-click context menu
      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        return false;
      };
      
      // Disable F12, Ctrl+Shift+I, Ctrl+U
      const handleKeyDown = (e: KeyboardEvent) => {
        if (
          e.key === 'F12' ||
          (e.ctrlKey && e.shiftKey && e.key === 'I') ||
          (e.ctrlKey && e.key === 'u')
        ) {
          e.preventDefault();
          return false;
        }
      };
      
      document.addEventListener('contextmenu', handleContextMenu);
      document.addEventListener('keydown', handleKeyDown);
      
      // Cleanup
      return () => {
        document.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
    
    // Check wallet connection security
    const checkWalletSecurity = () => {
      try {
        // Ensure TON Connect is using secure connections
        if (window.location.protocol === 'https:' || window.location.hostname === 'localhost') {
          // Secure context - OK
        } else {
          warnings.push('Wallet connections require secure context (HTTPS)');
        }
      } catch (error) {
        console.warn('Security check failed:', error);
      }
    };
    
    checkWalletSecurity();
    
    // Update security state
    setSecurityState({
      isSecure: warnings.length === 0,
      warnings
    });
    
    // Show security warnings in development
    if (process.env.NODE_ENV === 'development' && warnings.length > 0) {
      warnings.forEach(warning => {
        console.warn(`🔒 Security Warning: ${warning}`);
      });
    }
    
  }, []);

  // CSP and security headers setup
  useEffect(() => {
    // Set security-related meta tags if not already present
    const setSecurityMeta = (name: string, content: string) => {
      if (!document.querySelector(`meta[name="${name}"]`)) {
        const meta = document.createElement('meta');
        meta.name = name;
        meta.content = content;
        document.head.appendChild(meta);
      }
    };
    
    // Basic security headers via meta tags
    setSecurityMeta('referrer', 'strict-origin-when-cross-origin');
    setSecurityMeta('format-detection', 'telephone=no');
    
    // Prevent clickjacking
    if (window.self !== window.top) {
      document.body.style.display = 'none';
      console.error('Application cannot be embedded in frames for security reasons');
    }
    
  }, []);

  // Rate limiting for sensitive operations
  const createRateLimiter = (maxAttempts: number, windowMs: number) => {
    const attempts = new Map<string, number[]>();
    
    return (key: string): boolean => {
      const now = Date.now();
      const userAttempts = attempts.get(key) || [];
      
      // Remove old attempts outside the window
      const validAttempts = userAttempts.filter(time => now - time < windowMs);
      
      if (validAttempts.length >= maxAttempts) {
        return false; // Rate limited
      }
      
      validAttempts.push(now);
      attempts.set(key, validAttempts);
      return true; // Allowed
    };
  };

  // Provide security utilities to child components
  const securityUtils = {
    rateLimitWalletConnection: createRateLimiter(5, 60000), // 5 attempts per minute
    rateLimitTransaction: createRateLimiter(10, 300000), // 10 transactions per 5 minutes
    sanitizeUserInput: (input: string): string => {
      return input
        .replace(/[<>]/g, '') // Remove potential XSS vectors
        .replace(/javascript:/gi, '') // Remove javascript: URLs
        .trim()
        .slice(0, 1000); // Limit length
    },
    validateTonAddress: (address: string): boolean => {
      // Basic TON address validation
      return /^[a-zA-Z0-9_-]{48}$/.test(address) && 
             (address.startsWith('EQ') || address.startsWith('UQ') || address.startsWith('kQ'));
    }
  };

  // Add security utils to window for global access (development only)
  if (process.env.NODE_ENV === 'development') {
    (window as any).audiotonSecurity = securityUtils;
  }

  return (
    <div data-security-enabled={securityState.isSecure}>
      {children}
      
      {/* Security status indicator for development */}
      {process.env.NODE_ENV === 'development' && securityState.warnings.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 max-w-md rounded shadow-lg z-50">
          <div className="flex">
            <div className="flex-shrink-0">
              🔒
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">Security Warnings:</p>
              <ul className="mt-1 text-xs">
                {securityState.warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};