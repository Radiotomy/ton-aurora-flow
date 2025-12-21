import { Download, Share, MoreVertical, Plus, Check, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { motion } from 'framer-motion';

const Install = () => {
  const { canInstall, isIOS, isAndroid, isInstalled, isStandalone, promptInstall } = usePWAInstall();

  if (isInstalled || isStandalone) {
    return (
      <div className="min-h-screen bg-background pt-20 pb-32 px-4">
        <div className="max-w-md mx-auto text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-success/20 flex items-center justify-center"
          >
            <Check className="h-10 w-10 text-success" />
          </motion.div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Already Installed!</h1>
          <p className="text-muted-foreground">
            You're using AudioTon as an installed app. Enjoy the full experience!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-32 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
            <Smartphone className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Install AudioTon</h1>
          <p className="text-muted-foreground">
            Add AudioTon to your home screen for the best experience
          </p>
        </div>

        {/* Benefits */}
        <div className="glass-panel rounded-xl p-4 mb-6">
          <h2 className="font-semibold text-foreground mb-3">Why Install?</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success shrink-0" />
              <span>Instant access from your home screen</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success shrink-0" />
              <span>Works offline for browsing content</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success shrink-0" />
              <span>Full-screen immersive experience</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success shrink-0" />
              <span>Faster loading and performance</span>
            </li>
          </ul>
        </div>

        {/* Install Button (for supported browsers) */}
        {canInstall && (
          <Button
            size="lg"
            className="w-full mb-6"
            onClick={promptInstall}
          >
            <Download className="h-5 w-5 mr-2" />
            Install Now
          </Button>
        )}

        {/* iOS Instructions */}
        {isIOS && (
          <div className="glass-panel rounded-xl p-4 mb-6">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-xs font-bold">
                
              </div>
              iOS Installation
            </h2>
            <ol className="space-y-4 text-sm">
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 text-xs font-bold">
                  1
                </span>
                <div>
                  <p className="text-foreground font-medium">Tap the Share button</p>
                  <p className="text-muted-foreground">
                    Look for <Share className="h-3 w-3 inline mx-1" /> at the bottom of Safari
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 text-xs font-bold">
                  2
                </span>
                <div>
                  <p className="text-foreground font-medium">Scroll down and tap</p>
                  <p className="text-muted-foreground">
                    "Add to Home Screen" <Plus className="h-3 w-3 inline mx-1" />
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 text-xs font-bold">
                  3
                </span>
                <div>
                  <p className="text-foreground font-medium">Tap "Add"</p>
                  <p className="text-muted-foreground">
                    AudioTon will appear on your home screen
                  </p>
                </div>
              </li>
            </ol>
          </div>
        )}

        {/* Android Instructions */}
        {isAndroid && !canInstall && (
          <div className="glass-panel rounded-xl p-4 mb-6">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-success/20 flex items-center justify-center">
                <Smartphone className="h-4 w-4 text-success" />
              </div>
              Android Installation
            </h2>
            <ol className="space-y-4 text-sm">
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 text-xs font-bold">
                  1
                </span>
                <div>
                  <p className="text-foreground font-medium">Tap the menu button</p>
                  <p className="text-muted-foreground">
                    Look for <MoreVertical className="h-3 w-3 inline mx-1" /> in Chrome
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 text-xs font-bold">
                  2
                </span>
                <div>
                  <p className="text-foreground font-medium">Select "Install app"</p>
                  <p className="text-muted-foreground">
                    Or "Add to Home screen"
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 text-xs font-bold">
                  3
                </span>
                <div>
                  <p className="text-foreground font-medium">Tap "Install"</p>
                  <p className="text-muted-foreground">
                    AudioTon will be added to your apps
                  </p>
                </div>
              </li>
            </ol>
          </div>
        )}

        {/* Generic desktop instructions */}
        {!isIOS && !isAndroid && !canInstall && (
          <div className="glass-panel rounded-xl p-4">
            <h2 className="font-semibold text-foreground mb-3">Desktop Installation</h2>
            <p className="text-sm text-muted-foreground">
              Look for the install icon in your browser's address bar, or check the browser menu for "Install AudioTon" option.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Install;
