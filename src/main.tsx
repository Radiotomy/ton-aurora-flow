import { createRoot } from 'react-dom/client'
import './polyfills'
import App from './App.tsx'
import './index.css'
import { suppressThirdPartyErrors, setupGlobalErrorHandlers } from './utils/errorSuppression'

// Initialize error suppression early
suppressThirdPartyErrors();
setupGlobalErrorHandlers();

// Register service worker for PWA - wrapped in try-catch to prevent blocking React mount
try {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({
      onNeedRefresh() {
        console.log('New content available, refresh to update');
      },
      onOfflineReady() {
        console.log('App ready for offline use');
      },
      onRegisteredSW(swUrl: string) {
        console.log('Service Worker registered:', swUrl);
      },
      onRegisterError(error: Error) {
        console.error('Service Worker registration error:', error);
      }
    });
  }).catch((err) => {
    console.warn('PWA registration skipped:', err);
  });
} catch (e) {
  console.warn('PWA module unavailable:', e);
}

createRoot(document.getElementById("root")!).render(<App />);
