import { Buffer } from 'buffer';

declare global {
  interface Window {
    Buffer: typeof Buffer;
    global: typeof globalThis;
    process: {
      env: Record<string, string | undefined>;
    };
  }
  
  const Buffer: typeof import('buffer').Buffer;
  const global: typeof globalThis;
}