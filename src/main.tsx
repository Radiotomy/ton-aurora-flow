import { createRoot } from 'react-dom/client'
import './polyfills'
import App from './App.tsx'
import './index.css'
import { suppressThirdPartyErrors, setupGlobalErrorHandlers } from './utils/errorSuppression'
import { registerSW } from 'virtual:pwa-register'

// Initialize error suppression early
suppressThirdPartyErrors();
setupGlobalErrorHandlers();

// Register service worker for PWA
registerSW({
  onNeedRefresh() {
    // Could show a toast here to prompt user to refresh
    console.log('New content available, refresh to update');
  },
  onOfflineReady() {
    console.log('App ready for offline use');
  },
  onRegisteredSW(swUrl, registration) {
    console.log('Service Worker registered:', swUrl);
  },
  onRegisterError(error) {
    console.error('Service Worker registration error:', error);
  }
});

createRoot(document.getElementById("root")!).render(<App />);
