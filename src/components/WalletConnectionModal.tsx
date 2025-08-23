import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWeb3 } from '@/hooks/useWeb3';
import { useToast } from '@/hooks/use-toast';
import {
  Wallet,
  Smartphone,
  Monitor,
  QrCode,
  Shield,
  Zap,
  CheckCircle,
  ExternalLink,
  ArrowRight,
  Info
} from 'lucide-react';

interface WalletConnectionModalProps {
  open: boolean;
  onClose: () => void;
}

export const WalletConnectionModal: React.FC<WalletConnectionModalProps> = ({ open, onClose }) => {
  const [connectionMethod, setConnectionMethod] = useState<'qr' | 'deeplink' | null>(null);
  const { connectWallet, isLoading } = useWeb3();
  const { toast } = useToast();

  const walletFeatures = [
    { icon: Shield, title: 'Secure Connection', description: 'End-to-end encrypted communication' },
    { icon: Zap, title: 'Lightning Fast', description: 'Instant transactions on TON Network' },
    { icon: CheckCircle, title: 'Verified', description: 'Officially supported by TON Foundation' }
  ];

  const supportedWallets = [
    {
      name: 'Tonkeeper',
      description: 'The most popular TON wallet',
      icon: '💎',
      features: ['Mobile & Desktop', 'TON DNS', 'NFT Support'],
      downloadUrl: 'https://tonkeeper.com/'
    },
    {
      name: 'TON Wallet',
      description: 'Official TON Foundation wallet',
      icon: '🔷',
      features: ['Chrome Extension', 'Web Interface', 'Multi-account'],
      downloadUrl: 'https://wallet.ton.org/'
    },
    {
      name: 'MyTonWallet',
      description: 'Open source TON wallet',
      icon: '🟦',
      features: ['Browser Extension', 'Hardware Support', 'Advanced Features'],
      downloadUrl: 'https://mytonwallet.io/'
    }
  ];

  const handleConnect = async () => {
    try {
      await connectWallet();
      onClose();
    } catch (error) {
      // Error handling is done in useWeb3 hook
    }
  };

  const handleInstallWallet = (url: string) => {
    window.open(url, '_blank');
    toast({
      title: "Installing Wallet",
      description: "After installation, return here to connect your wallet.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl glass-panel border-glass">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 rounded-full bg-aurora/20">
              <Wallet className="h-6 w-6 text-aurora" />
            </div>
            Connect Your TON Wallet
          </DialogTitle>
          <DialogDescription className="text-base">
            Connect your TON wallet to access Web3 music features, collect NFTs, and join fan clubs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Features Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {walletFeatures.map((feature, index) => (
              <Card key={index} className="glass-panel-active border-glass">
                <CardContent className="p-4 text-center">
                  <div className="flex justify-center mb-3">
                    <div className="p-3 rounded-full bg-aurora/20">
                      <feature.icon className="h-6 w-6 text-aurora" />
                    </div>
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Connection Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Choose Connection Method</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={handleConnect}
                disabled={isLoading}
                className="h-auto p-6 justify-start glass-panel hover:glass-panel-hover"
              >
                <div className="flex items-center gap-4 w-full">
                  <div className="p-3 rounded-full bg-primary/20">
                    <QrCode className="h-6 w-6" />
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="font-semibold">QR Code</h4>
                    <p className="text-sm text-muted-foreground">Scan with mobile wallet</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={handleConnect}
                disabled={isLoading}
                className="h-auto p-6 justify-start glass-panel hover:glass-panel-hover"
              >
                <div className="flex items-center gap-4 w-full">
                  <div className="p-3 rounded-full bg-secondary/20">
                    <Monitor className="h-6 w-6" />
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="font-semibold">Browser Extension</h4>
                    <p className="text-sm text-muted-foreground">Connect desktop wallet</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Button>
            </div>
          </div>

          {/* Supported Wallets */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Supported Wallets</h3>
              <Badge variant="secondary" className="text-xs">
                {supportedWallets.length} Available
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {supportedWallets.map((wallet, index) => (
                <Card key={index} className="glass-panel border-glass">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl">{wallet.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{wallet.name}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{wallet.description}</p>
                          <div className="flex flex-wrap gap-1">
                            {wallet.features.map((feature, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleInstallWallet(wallet.downloadUrl)}
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Install
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Security Notice */}
          <Card className="glass-panel border-yellow-500/20 bg-yellow-500/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-semibold text-yellow-500">Security Notice</h4>
                  <p className="text-sm text-muted-foreground">
                    Only connect wallets you trust. We will never ask for your seed phrase or private keys. 
                    Always verify the wallet connection request before approving.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleConnect}
              disabled={isLoading}
              className="flex-1"
              variant="aurora"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect Wallet Now
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletConnectionModal;