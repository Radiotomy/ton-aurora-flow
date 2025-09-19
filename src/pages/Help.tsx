import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Music, 
  Users, 
  Wallet, 
  HelpCircle, 
  BookOpen, 
  MessageCircle,
  Mail,
  ExternalLink,
  Heart,
  Headphones,
  Palette,
  Coins
} from 'lucide-react';

const Help = () => {
  const userTypes = [
    {
      icon: Headphones,
      title: "Music Fans",
      description: "Stream, discover, and support your favorite artists",
      link: "/help/fans",
      features: ["Free music streaming", "Direct artist tipping", "Collect music NFTs", "Join fan communities"]
    },
    {
      icon: Palette,
      title: "Independent Artists",
      description: "Share your music and earn directly from fans",
      link: "/help/artists", 
      features: ["Upload & distribute music", "Receive direct payments", "Create exclusive NFTs", "Build fan communities"]
    }
  ];

  const quickHelp = [
    {
      icon: Wallet,
      title: "Connect Your Wallet",
      description: "Link your TON wallet to tip artists and collect NFTs",
      action: "Connect Wallet"
    },
    {
      icon: Music,
      title: "Discover Music",
      description: "Browse trending tracks from independent artists worldwide",
      action: "Explore Music"
    },
    {
      icon: Coins,
      title: "Support Artists",
      description: "Send TON tips directly to creators you love",
      action: "Start Tipping"
    },
    {
      icon: Users,
      title: "Join Communities",
      description: "Connect with other fans and artists in fan clubs",
      action: "Find Communities"
    }
  ];

  const support = [
    {
      icon: MessageCircle,
      title: "Community Discord",
      description: "Get real-time help from our community",
      link: "#"
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Contact our support team directly",
      link: "mailto:support@audioton.app"
    },
    {
      icon: BookOpen,
      title: "Documentation",
      description: "Browse our comprehensive guides",
      link: "#"
    }
  ];

  return (
    <main className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <Badge variant="outline" className="mb-4">
          <HelpCircle className="w-4 h-4 mr-2" />
          Help Center
        </Badge>
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Welcome to <span className="gradient-text">AudioTon</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Your Web3 music platform combining TON blockchain payments with Audius music discovery.
          Get started based on how you want to use AudioTon.
        </p>
      </div>

      {/* User Types */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
          Choose Your Journey
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          {userTypes.map((type) => (
            <Card key={type.title} className="group glass-panel hover:border-aurora/50 transition-all duration-300">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-aurora/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-aurora/20 transition-colors">
                  <type.icon className="w-8 h-8 text-aurora" />
                </div>
                <CardTitle className="text-xl">{type.title}</CardTitle>
                <CardDescription>{type.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {type.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 bg-aurora rounded-full mr-3" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button asChild className="w-full">
                  <Link to={type.link}>
                    Get Started Guide
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Quick Help */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
          Quick Start Guide
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickHelp.map((item) => (
            <Card key={item.title} className="glass-panel hover:border-aurora/30 transition-all duration-300">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-aurora/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <item.icon className="w-6 h-6 text-aurora" />
                </div>
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <CardDescription className="text-sm">{item.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="outline" size="sm" className="w-full">
                  {item.action}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Platform Overview */}
      <section className="mb-16">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="w-5 h-5 text-aurora" />
              How AudioTon Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-aurora/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Music className="w-6 h-6 text-aurora" />
                </div>
                <h3 className="font-semibold mb-2">Stream Music</h3>
                <p className="text-sm text-muted-foreground">
                  Access thousands of independent tracks through our Audius integration - completely free
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-aurora/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-6 h-6 text-aurora" />
                </div>
                <h3 className="font-semibold mb-2">Connect Wallet</h3>
                <p className="text-sm text-muted-foreground">
                  Link your TON wallet to unlock Web3 features like tipping and NFT collecting
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-aurora/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-6 h-6 text-aurora" />
                </div>
                <h3 className="font-semibold mb-2">Support Artists</h3>
                <p className="text-sm text-muted-foreground">
                  Send direct TON payments to artists, no middlemen or delays
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Support Options */}
      <section>
        <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
          Need More Help?
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {support.map((item) => (
            <Card key={item.title} className="glass-panel hover:border-aurora/30 transition-all duration-300">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-aurora/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <item.icon className="w-6 h-6 text-aurora" />
                </div>
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <a href={item.link} target="_blank" rel="noopener noreferrer">
                    Get Help
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
};

export default Help;