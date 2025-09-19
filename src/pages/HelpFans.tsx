import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Headphones, 
  Wallet, 
  Heart, 
  Gem, 
  Users, 
  Search,
  Play,
  ArrowLeft,
  CheckCircle,
  Coins,
  Music,
  Star,
  MessageCircle
} from 'lucide-react';

const HelpFans = () => {
  const steps = [
    {
      number: 1,
      icon: Wallet,
      title: "Connect Your TON Wallet",
      description: "Link your wallet to unlock Web3 features",
      details: [
        "Click 'Connect Wallet' in the top navigation",
        "Choose your preferred TON wallet (Tonkeeper, Telegram Wallet, etc.)",
        "Approve the connection request",
        "Your wallet address will appear in the navigation"
      ],
      tip: "You can still stream music without a wallet, but you'll need one to tip artists and collect NFTs"
    },
    {
      number: 2,
      icon: Search,
      title: "Discover Amazing Music",
      description: "Find your new favorite independent artists",
      details: [
        "Browse trending tracks on the homepage",
        "Use the search function to find specific artists or songs",
        "Explore different genres and curated playlists",
        "Check out featured artists and their profiles"
      ],
      tip: "Use voice search (microphone icon) for hands-free music discovery"
    },
    {
      number: 3,
      icon: Play,
      title: "Stream Music for Free",
      description: "Enjoy unlimited music streaming",
      details: [
        "Click any track to start playing instantly",
        "Build custom playlists of your favorite songs",
        "Queue up multiple tracks for continuous listening",
        "Use the mini-player controls at the bottom"
      ],
      tip: "All music streaming is completely free - no subscription required"
    },
    {
      number: 4,
      icon: Heart,
      title: "Support Your Favorite Artists",
      description: "Send direct tips with TON cryptocurrency",
      details: [
        "Click the tip button on any track or artist profile",
        "Enter the amount of TON you want to send (minimum 0.1 TON)",
        "Confirm the transaction in your wallet",
        "Artists receive 100% of your tip directly"
      ],
      tip: "Tips go directly to artists with no platform fees or delays"
    },
    {
      number: 5,
      icon: Gem,
      title: "Collect Music NFTs",
      description: "Own exclusive digital collectibles from artists",
      details: [
        "Browse the NFT Marketplace for exclusive music collectibles",
        "Purchase limited edition tracks, album art, or special releases",
        "View your NFT collection in your dashboard",
        "Some NFTs unlock special perks or exclusive content"
      ],
      tip: "NFTs often come with special benefits like early access to new releases"
    },
    {
      number: 6,
      icon: Users,
      title: "Join Fan Communities",
      description: "Connect with other fans and artists",
      details: [
        "Join fan clubs for your favorite artists",
        "Participate in community polls and discussions",
        "Get exclusive updates and behind-the-scenes content",
        "Connect with other fans who share your taste in music"
      ],
      tip: "Fan club members often get early access to new releases and exclusive content"
    }
  ];

  const features = [
    {
      icon: Music,
      title: "Free Music Streaming",
      description: "Access thousands of independent tracks with no subscription fees"
    },
    {
      icon: Coins,
      title: "Direct Artist Support",
      description: "Send TON tips directly to creators with no platform fees"
    },
    {
      icon: Gem,
      title: "Music NFT Collection",
      description: "Own exclusive digital collectibles and unlock special perks"
    },
    {
      icon: Users,
      title: "Fan Communities",
      description: "Join exclusive fan clubs and connect with other music lovers"
    },
    {
      icon: Star,
      title: "Personalized Experience",
      description: "Get AI-powered recommendations based on your listening habits"
    },
    {
      icon: MessageCircle,
      title: "Direct Artist Interaction",
      description: "Comment on tracks and interact directly with your favorite artists"
    }
  ];

  const walletInfo = [
    {
      name: "Tonkeeper",
      description: "Most popular TON wallet with mobile and desktop apps",
      recommended: true
    },
    {
      name: "Telegram Wallet",
      description: "Built into Telegram - convenient if you already use Telegram",
      recommended: false
    },
    {
      name: "TON Space",
      description: "Browser extension wallet for desktop users",
      recommended: false
    },
    {
      name: "MyTonWallet",
      description: "Web-based wallet - no app installation required",
      recommended: false
    }
  ];

  return (
    <main className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Button asChild variant="ghost" className="mb-4">
          <Link to="/help">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Help Center
          </Link>
        </Button>
        
        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-4">
            <Headphones className="w-4 h-4 mr-2" />
            Fan Guide
          </Badge>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Music Fan <span className="gradient-text">Quick Start Guide</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Everything you need to know to start discovering, streaming, and supporting independent artists on AudioTon
          </p>
        </div>
      </div>

      {/* Step-by-Step Guide */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-foreground mb-8">
          Getting Started in 6 Easy Steps
        </h2>
        
        {steps.map((step) => (
          <Card key={step.number} className="glass-panel mb-6">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-aurora rounded-full flex items-center justify-center font-bold text-background shrink-0">
                  {step.number}
                </div>
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 text-xl mb-2">
                    <step.icon className="w-5 h-5 text-aurora" />
                    {step.title}
                  </CardTitle>
                  <CardDescription className="text-base">{step.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-4">
                {step.details.map((detail, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-aurora mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">{detail}</span>
                  </li>
                ))}
              </ul>
              <div className="bg-aurora/10 rounded-lg p-3">
                <p className="text-sm text-foreground">
                  <strong>💡 Pro Tip:</strong> {step.tip}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Wallet Information */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-foreground mb-8">
          Supported TON Wallets
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {walletInfo.map((wallet) => (
            <Card key={wallet.name} className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {wallet.name}
                  {wallet.recommended && (
                    <Badge variant="secondary" className="text-xs">
                      Recommended
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>{wallet.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Platform Features */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-foreground mb-8">
          What You Can Do on AudioTon
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="glass-panel">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-aurora/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <feature.icon className="w-6 h-6 text-aurora" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription className="text-sm">{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="text-2xl font-bold text-foreground mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="text-lg">Do I need to pay to listen to music?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                No! All music streaming on AudioTon is completely free. You only need TON tokens if you want to tip artists or collect NFTs.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="text-lg">How much should I tip artists?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                The minimum tip is 0.1 TON (to cover transaction fees). Many fans tip 1-5 TON for songs they really love, but any amount helps support independent artists.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="text-lg">Are my payments secure?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Yes! All payments are processed directly through the TON blockchain. AudioTon never holds custody of your funds - payments go directly from your wallet to the artist.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="text-lg">Can I use AudioTon without a crypto wallet?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Absolutely! You can stream music, create playlists, and discover new artists without a wallet. Connecting a wallet only unlocks additional Web3 features like tipping and NFT collecting.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
};

export default HelpFans;