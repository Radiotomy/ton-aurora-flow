/**
 * Monitoring & Observability Service for AudioTon Production
 * Tracks errors, performance, user actions, and system health
 */

import { supabase } from '@/integrations/supabase/client';

export type LogLevel = 'info' | 'warn' | 'error' | 'critical';

export type EventCategory = 
  | 'auth'
  | 'wallet'
  | 'nft'
  | 'payment'
  | 'playback'
  | 'social'
  | 'system'
  | 'security';

interface MonitoringEvent {
  level: LogLevel;
  category: EventCategory;
  message: string;
  details?: Record<string, any>;
  userId?: string;
  timestamp: string;
  userAgent?: string;
  url?: string;
}

class MonitoringService {
  private queue: MonitoringEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly MAX_QUEUE_SIZE = 50;
  private readonly FLUSH_INTERVAL_MS = 30000; // 30 seconds

  constructor() {
    this.startAutoFlush();
    this.setupErrorHandlers();
  }

  /**
   * Log an event to the monitoring system
   */
  async log(
    level: LogLevel,
    category: EventCategory,
    message: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      const event: MonitoringEvent = {
        level,
        category,
        message,
        details,
        userId: await this.getCurrentUserId(),
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      // Log to console in development
      if (import.meta.env.DEV) {
        console.log(`[${level.toUpperCase()}] [${category}]`, message, details);
      }

      // Add to queue
      this.queue.push(event);

      // Flush if critical or queue is full
      if (level === 'critical' || this.queue.length >= this.MAX_QUEUE_SIZE) {
        await this.flush();
      }
    } catch (error) {
      console.error('Monitoring service error:', error);
    }
  }

  /**
   * Log info level event
   */
  info(category: EventCategory, message: string, details?: Record<string, any>) {
    return this.log('info', category, message, details);
  }

  /**
   * Log warning level event
   */
  warn(category: EventCategory, message: string, details?: Record<string, any>) {
    return this.log('warn', category, message, details);
  }

  /**
   * Log error level event
   */
  error(category: EventCategory, message: string, details?: Record<string, any>) {
    return this.log('error', category, message, details);
  }

  /**
   * Log critical level event
   */
  critical(category: EventCategory, message: string, details?: Record<string, any>) {
    return this.log('critical', category, message, details);
  }

  /**
   * Track user action/event
   */
  async trackEvent(
    eventName: string,
    properties?: Record<string, any>
  ): Promise<void> {
    return this.info('system', `Event: ${eventName}`, properties);
  }

  /**
   * Track page view
   */
  async trackPageView(path: string): Promise<void> {
    return this.info('system', 'Page View', { path });
  }

  /**
   * Track performance metric
   */
  async trackPerformance(
    metricName: string,
    value: number,
    unit: string = 'ms'
  ): Promise<void> {
    return this.info('system', `Performance: ${metricName}`, {
      value,
      unit,
      timestamp: Date.now(),
    });
  }

  /**
   * Track wallet connection
   */
  async trackWalletConnection(
    address: string,
    success: boolean,
    error?: string
  ): Promise<void> {
    return this.log(
      success ? 'info' : 'error',
      'wallet',
      success ? 'Wallet Connected' : 'Wallet Connection Failed',
      { address, error }
    );
  }

  /**
   * Track NFT mint
   */
  async trackNFTMint(
    nftId: string,
    trackId: string,
    success: boolean,
    error?: string
  ): Promise<void> {
    return this.log(
      success ? 'info' : 'error',
      'nft',
      success ? 'NFT Minted' : 'NFT Mint Failed',
      { nftId, trackId, error }
    );
  }

  /**
   * Track payment transaction
   */
  async trackPayment(
    amount: number,
    currency: string,
    success: boolean,
    transactionId?: string,
    error?: string
  ): Promise<void> {
    return this.log(
      success ? 'info' : 'error',
      'payment',
      success ? 'Payment Successful' : 'Payment Failed',
      { amount, currency, transactionId, error }
    );
  }

  /**
   * Track security event
   */
  async trackSecurityEvent(
    eventType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details?: Record<string, any>
  ): Promise<void> {
    const level: LogLevel = severity === 'critical' ? 'critical' : 
                           severity === 'high' ? 'error' : 
                           severity === 'medium' ? 'warn' : 'info';
    
    return this.log(level, 'security', `Security: ${eventType}`, {
      severity,
      ...details,
    });
  }

  /**
   * Flush queued events to database
   */
  private async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      // Send to edge function for processing
      const { error } = await supabase.functions.invoke('monitoring-logs', {
        body: { events },
      });

      if (error) {
        console.error('Failed to flush monitoring logs:', error);
        // Re-queue on failure
        this.queue.unshift(...events);
      }
    } catch (error) {
      console.error('Error flushing monitoring logs:', error);
      // Re-queue on failure
      this.queue.unshift(...events);
    }
  }

  /**
   * Start automatic flushing
   */
  private startAutoFlush(): void {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL_MS);
  }

  /**
   * Stop automatic flushing
   */
  private stopAutoFlush(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  /**
   * Setup global error handlers
   */
  private setupErrorHandlers(): void {
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('system', 'Unhandled Promise Rejection', {
        reason: event.reason,
        promise: String(event.promise),
      });
    });

    // Global errors
    window.addEventListener('error', (event) => {
      this.error('system', 'Global Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack,
      });
    });

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flush();
      this.stopAutoFlush();
    });
  }

  /**
   * Get current user ID
   */
  private async getCurrentUserId(): Promise<string | undefined> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id;
    } catch {
      return undefined;
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopAutoFlush();
    this.flush();
  }
}

// Export singleton instance
export const monitoring = new MonitoringService();

// Export for use in other modules
export default monitoring;
