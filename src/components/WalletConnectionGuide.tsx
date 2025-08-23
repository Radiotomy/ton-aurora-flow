import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Smartphone,
  Globe,
  Zap,
  CheckCircle,
  ArrowRight,
  Download,
  ExternalLink,
  AlertTriangle,
  Lock,
  Wallet
} from 'lucide-react';

interface WalletConnectionGuideProps {
  onGetStarted?: () => void;
}

export const WalletConnectionGuide: React.FC<WalletConnectionGuideProps> = ({ onGetStarted }) => {
  const benefits = [
    {
      icon: Shield,
      title: 'True Ownership',
      description: 'Your music NFTs and digital assets are truly yours, stored securely on the blockchain.'
    },
    {
      icon: Zap,
      title: 'Instant Payments',
      description: 'Send TON payments to artists instantly with minimal fees and lightning-fast confirmation.'
    },
    {
      icon: Lock,
      title: 'Privacy First',
      description: 'Connect anonymously without sharing personal information. Your privacy is protected.'
    },
    {
      icon: Globe,
      title: 'Global Access',
      description: 'Access Web3 music features from anywhere in the world, no restrictions or barriers.'
    }
  ];

  const walletOptions = [
    {
      name: 'Tonkeeper',
      description: 'Most popular TON wallet with great mobile experience',
      platforms: ['iOS', 'Android', 'Chrome'],
      features: ['Easy setup', 'TON DNS support', 'NFT gallery'],
      recommended: true,
      downloadUrl: 'https://tonkeeper.com/',
      icon: '💎'
    },
    {
      name: 'MyTonWallet',
      description: 'Open-source wallet with advanced features',
      platforms: ['Web', 'Chrome Extension'],
      features: ['Hardware wallet support', 'Advanced security', 'Multi-account'],
      recommended: false,
      downloadUrl: 'https://mytonwallet.io/',
      icon: '🟦'
    },
    {
      name: 'TON Wallet',
      description: 'Official TON Foundation wallet',
      platforms: ['Chrome Extension', 'Web'],
      features: ['Official support', 'Simple interface', 'Secure'],
      recommended: false,
      downloadUrl: 'https://wallet.ton.org/',
      icon: '🔷'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-aurora/20 animate-pulse-slow">
            <Wallet className="h-12 w-12 text-aurora" />
          </div>
        </div>
        <h2 className="text-3xl font-bold bg-aurora bg-clip-text text-transparent">
          Connect to Web3 Music
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Join the decentralized music revolution. Connect your TON wallet to collect NFTs, 
          support artists directly, and access exclusive content.
        </p>
      </div>

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {benefits.map((benefit, index) => (
          <Card key={index} className="glass-panel border-glass">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-aurora/20">
                  <benefit.icon className="h-6 w-6 text-aurora" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Wallet Options */}
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-center">Choose Your Wallet</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {walletOptions.map((wallet, index) => (
            <Card key={index} className={`glass-panel border-glass relative ${
              wallet.recommended ? 'ring-2 ring-aurora ring-opacity-50' : ''
            }`}>
              {wallet.recommended && (
                <Badge className="absolute -top-2 left-4 bg-aurora text-background">
                  Recommended
                </Badge>
              )}
              <CardHeader className="text-center pb-4">
                <div className="text-4xl mb-2">{wallet.icon}</div>
                <CardTitle className="text-xl">{wallet.name}</CardTitle>
                <CardDescription>{wallet.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Platforms */}
                <div>
                  <p className="text-sm font-medium mb-2">Platforms:</p>
                  <div className="flex flex-wrap gap-1">
                    {wallet.platforms.map((platform) => (
                      <Badge key={platform} variant="secondary" className="text-xs">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Features */}
                <div>
                  <p className="text-sm font-medium mb-2">Features:</p>
                  <div className="space-y-1">
                    {wallet.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-3 w-3 text-green-400" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  variant={wallet.recommended ? "aurora" : "outline"}
                  className="w-full"
                  onClick={() => window.open(wallet.downloadUrl, '_blank')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Get {wallet.name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Security Notice */}
      <Card className="glass-panel border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0" />
            <div className="space-y-2">
              <h3 className="font-semibold text-amber-500">Security Best Practices</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>• Never share your seed phrase or private keys with anyone</p>
                <p>• Always verify the wallet website URL before downloading</p>
                <p>• Keep your wallet software updated to the latest version</p>
                <p>• Use hardware wallets for large amounts of cryptocurrency</p>
                <p>• We will never ask for your wallet credentials</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Getting Started Steps */}
      <Card className="glass-panel border-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Quick Start Guide
          </CardTitle>
          <CardDescription>
            Follow these simple steps to connect your TON wallet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: 1, title: 'Download', description: 'Install a TON wallet from the options above' },
              { step: 2, title: 'Setup', description: 'Create a new wallet or import existing one' },
              { step: 3, title: 'Fund', description: 'Add some TON to your wallet for transactions' },
              { step: 4, title: 'Connect', description: 'Return here and click Connect Wallet' }
            ].map((item, index) => (
              <div key={index} className="text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-aurora/20 text-aurora font-bold flex items-center justify-center mx-auto">
                  {item.step}
                </div>
                <h4 className="font-semibold">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.description}</p>
                {index < 3 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground mx-auto md:hidden" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="text-center space-y-4">
        <Button 
          onClick={onGetStarted}
          size="lg"
          variant="aurora"
          className="px-8"
        >
          <Wallet className="h-5 w-5 mr-2" />
          Connect Your Wallet Now
        </Button>
        <p className="text-sm text-muted-foreground">
          Already have a wallet installed? Click above to connect instantly.
        </p>
      </div>
    </div>
  );
};

export default WalletConnectionGuide;