import { createRoot } from 'react-dom/client'
import './polyfills'
import App from './App.tsx'
import './index.css'
import { suppressThirdPartyErrors, setupGlobalErrorHandlers } from './utils/errorSuppression'

// Initialize error suppression early
suppressThirdPartyErrors();
setupGlobalErrorHandlers();

createRoot(document.getElementById("root")!).render(<App />);
