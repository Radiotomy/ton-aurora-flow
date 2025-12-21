import { Download, X, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { motion, AnimatePresence } from 'framer-motion';

export const PWAInstallBanner = () => {
  const { canInstall, isIOS, isInstalled, isStandalone, promptInstall, dismissPrompt } = usePWAInstall();

  // Don't show if already installed/standalone
  if (isInstalled || isStandalone) {
    return null;
  }

  // Show iOS-specific banner (iOS doesn't support beforeinstallprompt)
  if (isIOS) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-20 left-4 right-4 z-50 glass-panel rounded-xl p-4 border border-primary/20 shadow-lg"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/20 text-primary">
              <Share className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Install AudioTon</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tap <Share className="h-3 w-3 inline mx-0.5" /> then "Add to Home Screen"
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={dismissPrompt}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Show standard install banner for browsers that support it
  if (!canInstall) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-20 left-4 right-4 z-50 glass-panel rounded-xl p-4 border border-primary/20 shadow-lg"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20 text-primary">
            <Download className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Install AudioTon</p>
            <p className="text-xs text-muted-foreground">
              Get the full app experience
            </p>
          </div>
          <Button
            size="sm"
            className="shrink-0"
            onClick={promptInstall}
          >
            Install
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={dismissPrompt}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
