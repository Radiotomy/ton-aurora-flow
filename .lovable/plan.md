

## Fix: Blank Page Due to Module Loading Failures

### Root Cause
The sandbox proxy intermittently returns 503 for module requests during page load. `Navigation.tsx` eagerly imports `AudiusLoginButton`, which is in the critical render path (`App.tsx` → `Navigation` → `AudiusLoginButton`). When this import fails, React never mounts and the page stays blank with only the dark CSS background visible.

The network trace confirms: `AudiusLoginButton.tsx` → `ERR_ABORTED` (503), and zero React console output means `createRoot().render()` never completed.

### Plan

**1. Lazy-load AudiusLoginButton in Navigation.tsx**
- Wrap `AudiusLoginButton` in `React.lazy()` + `Suspense` with a small fallback
- This prevents a single module 503 from killing the entire app
- Same treatment for other heavy non-critical imports in Navigation (CrossChainBridgeModal, etc.)

**2. Lazy-load heavy imports in other eagerly-loaded components**
- `UserFeedSection.tsx` imports `AudiusLoginButton` — lazy-load it
- `Footer.tsx` and `ScrollToTop.tsx` — verify they're lightweight (likely fine)

**3. Add error resilience to main.tsx**
- Wrap `registerSW()` in try-catch so PWA registration failure doesn't block React mount
- The service worker registration is non-critical for initial render

**4. Add a global unhandled rejection handler before React mount**
- Ensure any uncaught promise rejection from module loading doesn't silently kill the app

### Files to modify
- `src/components/Navigation.tsx` — lazy-load AudiusLoginButton, CrossChainBridgeModal
- `src/components/UserFeedSection.tsx` — lazy-load AudiusLoginButton  
- `src/main.tsx` — wrap registerSW in try-catch
- `src/App.tsx` — optionally lazy-load Navigation itself with a minimal header fallback

