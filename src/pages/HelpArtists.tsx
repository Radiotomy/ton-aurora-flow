import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Palette, 
  Upload, 
  Wallet, 
  TrendingUp, 
  Users, 
  Gem,
  ArrowLeft,
  CheckCircle,
  Music,
  DollarSign,
  BarChart3,
  Star,
  Radio,
  Crown
} from 'lucide-react';

const HelpArtists = () => {
  const steps = [
    {
      number: 1,
      icon: Palette,
      title: "Become an Artist",
      description: "Upgrade your account to artist status",
      details: [
        "Navigate to your Dashboard and click 'Become an Artist'",
        "Option 1: Connect your existing Audius account for instant verification",
        "Option 2: Submit a platform artist application with your music portfolio",
        "Wait for approval (usually within 24-48 hours for applications)"
      ],
      tip: "Connecting an existing Audius account is the fastest way to get verified as an artist"
    },
    {
      number: 2,
      icon: Upload,
      title: "Upload Your Music",
      description: "Share your tracks with the world",
      details: [
        "Access the Creator Studio from your artist dashboard",
        "Upload high-quality audio files (MP3, WAV, FLAC supported)",
        "Add metadata: title, description, genre, artwork",
        "Set visibility (public, unlisted, or fan-club exclusive)"
      ],
      tip: "High-quality artwork and detailed descriptions help your music get discovered"
    },
    {
      number: 3,
      icon: Wallet,
      title: "Set Up Payment Receiving",
      description: "Configure how you'll receive payments",
      details: [
        "Connect your TON wallet to receive tips and NFT sales",
        "Verify your wallet address in your artist profile",
        "Set up payment notifications and alerts",
        "Tips are received instantly with no platform fees"
      ],
      tip: "Keep your wallet address up to date to ensure you receive all payments"
    },
    {
      number: 4,
      icon: Gem,
      title: "Create Music NFTs",
      description: "Monetize your art with exclusive collectibles",
      details: [
        "Use the NFT minting tool in Creator Studio",
        "Create limited edition tracks, artwork, or experiences",
        "Set pricing, supply limits, and special perks",
        "Launch NFT drops and promote to your fanbase"
      ],
      tip: "NFTs with exclusive perks (early access, behind-the-scenes content) tend to sell better"
    },
    {
      number: 5,
      icon: Users,
      title: "Build Your Fan Community",
      description: "Create and manage your fan club",
      details: [
        "Set up your fan club with exclusive content and perks",
        "Share behind-the-scenes content and updates",
        "Host live events and Q&A sessions",
        "Engage with fans through comments and messages"
      ],
      tip: "Regular engagement with your community leads to more loyal fans and higher earnings"
    },
    {
      number: 6,
      icon: TrendingUp,
      title: "Analyze and Grow",
      description: "Track your success and optimize",
      details: [
        "Monitor streaming statistics and revenue in your dashboard",
        "Track which songs perform best with your audience",
        "Use analytics to plan future releases and content",
        "Optimize your promotional strategy based on data"
      ],
      tip: "Pay attention to geographic data to plan tours and targeted promotion"
    }
  ];

  const artistFeatures = [
    {
      icon: Upload,
      title: "Music Distribution",
      description: "Upload and distribute your music to a global audience instantly"
    },
    {
      icon: DollarSign,
      title: "Direct Payments",
      description: "Receive TON tips directly from fans with zero platform fees"
    },
    {
      icon: Gem,
      title: "NFT Creation",
      description: "Mint exclusive music NFTs and digital collectibles for your fans"
    },
    {
      icon: Users,
      title: "Fan Club Management",
      description: "Build and manage exclusive communities around your music"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Track streams, earnings, and fan engagement with detailed insights"
    },
    {
      icon: Radio,
      title: "Live Events",
      description: "Host live streaming events and virtual concerts for your fans"
    }
  ];

  const monetizationOptions = [
    {
      icon: DollarSign,
      title: "Fan Tips",
      description: "Receive direct TON payments from fans who love your music",
      earning: "0.1 - 50+ TON per tip"
    },
    {
      icon: Gem,
      title: "Music NFTs",
      description: "Sell limited edition tracks, artwork, and exclusive experiences",
      earning: "5 - 500+ TON per NFT"
    },
    {
      icon: Crown,
      title: "Fan Club Memberships",
      description: "Offer paid subscriptions for exclusive content and perks",
      earning: "1 - 10 TON/month per member"
    },
    {
      icon: Radio,
      title: "Live Events",
      description: "Monetize virtual concerts and exclusive live performances",
      earning: "10 - 1000+ TON per event"
    }
  ];

  const artistTypes = [
    {
      type: "Audius Artist",
      description: "Already have an Audius account? Connect it for instant verification",
      benefits: ["Instant artist status", "Existing fanbase integration", "Track history import"],
      requirements: "Active Audius account with uploaded tracks"
    },
    {
      type: "Platform Artist",
      description: "New to Web3 music? Apply to become a native AudioTon artist",
      benefits: ["Full platform features", "Dedicated support", "Promotional opportunities"],
      requirements: "Music portfolio and artist application review"
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
            <Palette className="w-4 h-4 mr-2" />
            Artist Guide
          </Badge>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Independent Artist <span className="gradient-text">Success Guide</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Everything you need to know to start sharing your music and earning directly from fans on AudioTon
          </p>
        </div>
      </div>

      {/* Artist Types */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-foreground mb-8">
          Choose Your Artist Path
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {artistTypes.map((artist) => (
            <Card key={artist.type} className="glass-panel">
              <CardHeader>
                <CardTitle className="text-xl">{artist.type}</CardTitle>
                <CardDescription>{artist.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <p className="text-sm font-medium text-foreground">Benefits:</p>
                  <ul className="space-y-1">
                    {artist.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center text-sm text-muted-foreground">
                        <CheckCircle className="w-3 h-3 text-aurora mr-2 shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-aurora/10 rounded-lg p-3">
                  <p className="text-sm text-foreground">
                    <strong>Requirements:</strong> {artist.requirements}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Step-by-Step Guide */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-foreground mb-8">
          Your Artist Journey in 6 Steps
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

      {/* Monetization Options */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-foreground mb-8">
          How Artists Earn on AudioTon
        </h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {monetizationOptions.map((option) => (
            <Card key={option.title} className="glass-panel">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-aurora/10 rounded-lg flex items-center justify-center">
                    <option.icon className="w-5 h-5 text-aurora" />
                  </div>
                  <CardTitle className="text-lg">{option.title}</CardTitle>
                </div>
                <CardDescription>{option.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-aurora/10 rounded-lg p-3">
                  <p className="text-sm font-medium text-aurora">
                    Typical Earnings: {option.earning}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Artist Features */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-foreground mb-8">
          Artist Platform Features
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {artistFeatures.map((feature) => (
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
          Artist FAQ
        </h2>
        <div className="space-y-4">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="text-lg">How much does it cost to become an artist?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Becoming an artist on AudioTon is completely free! There are no signup fees, monthly costs, or hidden charges. We only make money when you do.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="text-lg">What percentage does AudioTon take from my earnings?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                AudioTon takes 0% of fan tips - they go directly to your wallet. For NFT sales, we take a small marketplace fee (typically 2.5%) to cover platform costs and development.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="text-lg">How quickly do I receive payments?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Tips are received instantly in your TON wallet - there's no waiting period. NFT sale proceeds are also processed immediately upon purchase.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="text-lg">Can I import my existing fanbase?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Yes! If you connect your Audius account, your existing tracks and follower data will be imported. You can also promote your AudioTon profile on other social platforms.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="text-lg">What file formats are supported for uploads?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We support MP3, WAV, and FLAC audio files. For best quality, we recommend uploading in WAV or FLAC format. Maximum file size is 100MB per track.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
};

export default HelpArtists;