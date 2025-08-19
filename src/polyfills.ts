import { Buffer } from 'buffer';

// Make Buffer available globally for TON SDK
if (typeof window !== 'undefined') {
  (window as any).Buffer = (window as any).Buffer || Buffer;
  (window as any).global = (window as any).global || window;
  (window as any).process = (window as any).process || { env: {} };
}

// Make Buffer available globally
(globalThis as any).Buffer = (globalThis as any).Buffer || Buffer;