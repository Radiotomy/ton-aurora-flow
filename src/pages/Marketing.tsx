import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, Zap, DollarSign, Globe, Award, Music, Shield, Headphones } from 'lucide-react';
import { motion } from 'framer-motion';
import BlockchainBackground from '@/components/BlockchainBackground';

const Marketing = () => {
  const keyStats = [
    { label: 'Market Size (2028)', value: '$42.3B', growth: '+145% CAGR', icon: TrendingUp },
    { label: 'Web3 Music Users', value: '15M+', growth: 'Globally', icon: Users },
    { label: 'Transaction Speed', value: '2.1s', growth: 'Avg Confirmation', icon: Zap },
    { label: 'Creator Revenue', value: '95%', growth: 'Industry Leading', icon: DollarSign },
  ];

  const features = [
    {
      icon: Music,
      title: 'Web3 Music Streaming',
      description: 'Decentralized music discovery through Audius Protocol with high-quality streaming',
      benefits: ['Free streaming access', 'Personalized recommendations', 'Cross-platform sync']
    },
    {
      icon: Shield,
      title: 'NFT Music Collectibles',
      description: 'Four-tier NFT system with exclusive perks and secondary marketplace trading',
      benefits: ['Bronze to Platinum tiers', 'Unique artwork & metadata', 'Exclusive access rights']
    },
    {
      icon: DollarSign,
      title: 'Direct Artist Support',
      description: 'Instant TON payments with 95% creator revenue share and transparent transactions',
      benefits: ['Ultra-low fees (<$0.01)', 'Transparent history', 'Optional public messages']
    },
    {
      icon: Users,
      title: 'Fan Club Communities',
      description: 'Token-gated exclusive content with direct artist communication channels',
      benefits: ['Community governance', 'Special events access', 'Behind-scenes content']
    },
    {
      icon: Zap,
      title: 'Live Event Streaming',
      description: 'Real-time concerts and events with blockchain-secured NFT ticketing system',
      benefits: ['WebRTC live streaming', 'NFT event tickets', 'Interactive chat & tipping']
    },
    {
      icon: Globe,
      title: 'Community Engagement',
      description: 'Real-time polls, chat, and social features powered by blockchain transparency',
      benefits: ['Live event chat', 'Community polls', 'Social connections']
    }
  ];

  const competitiveAdvantages = [
    'First-Mover Advantage: First TON + Audius integration with live streaming',
    'Ultra-Low Costs: TON blockchain efficiency for tickets and payments',
    'Live Event Innovation: WebRTC streaming with NFT ticketing system',
    'Telegram Integration: Access to 700M+ users for events and streaming',
    'Artist-Friendly Economics: Highest creator revenue share (95%)',
    'Real-Time Interactivity: Live chat, tipping, and polls during events'
  ];

  return (
    <div className="min-h-screen bg-background">
      <BlockchainBackground />
      
      {/* Header */}
      <motion.section 
        className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <Badge variant="secondary" className="glass-panel mb-6 text-lg px-6 py-2">
              <Globe className="w-4 h-4 mr-2" />
              Investor & Client Overview
            </Badge>
          </motion.div>
          
          <motion.h1 
            className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <span className="text-aurora">AudioTon</span>
            <br />
            <span className="text-foreground">The Web3 Music Revolution</span>
          </motion.h1>
          
          <motion.p 
            className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            The first Web3 music streaming platform integrating TON blockchain with Audius Protocol, 
            creating a revolutionary ecosystem where music lovers stream, collect, and directly support artists 
            through decentralized technology.
          </motion.p>
        </div>
      </motion.section>

      {/* Key Statistics */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.h2 
            className="text-3xl font-bold text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Market Opportunity & Performance
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {keyStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <Card className="glass-panel border-glass-border/30 hover:scale-105 transition-transform duration-300">
                  <CardContent className="p-6 text-center">
                    <stat.icon className="w-8 h-8 text-primary mx-auto mb-4" />
                    <div className="text-3xl font-bold text-aurora mb-2">{stat.value}</div>
                    <div className="text-sm text-muted-foreground mb-1">{stat.label}</div>
                    <Badge variant="outline" className="text-xs">
                      {stat.growth}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-background/50">
        <div className="max-w-6xl mx-auto">
          <motion.h2 
            className="text-3xl font-bold text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Revolutionary Platform Features
          </motion.h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <Card className="glass-panel border-glass-border/30 h-full">
                  <CardContent className="p-8">
                    <div className="flex items-center mb-4">
                      <feature.icon className="w-8 h-8 text-primary mr-4" />
                      <h3 className="text-xl font-bold">{feature.title}</h3>
                    </div>
                    <p className="text-muted-foreground mb-6">{feature.description}</p>
                    <div className="space-y-2">
                      {feature.benefits.map((benefit, i) => (
                        <div key={i} className="flex items-center text-sm">
                          <div className="w-2 h-2 bg-primary rounded-full mr-3" />
                          {benefit}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.h2 
            className="text-3xl font-bold text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Cutting-Edge Technology Infrastructure
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Card className="glass-panel border-glass-border/30 text-center">
                <CardContent className="p-8">
                  <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-4">Blockchain Infrastructure</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div>TON (The Open Network)</div>
                    <div>Sub-second confirmations</div>
                    <div>Ultra-low transaction fees</div>
                    <div>Smart contract integration</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Card className="glass-panel border-glass-border/30 text-center">
                <CardContent className="p-8">
                  <Headphones className="w-12 h-12 text-secondary mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-4">Music Infrastructure</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div>Audius Protocol integration</div>
                    <div>High-quality streaming</div>
                    <div>AI-powered discovery</div>
                    <div>Global content delivery</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Card className="glass-panel border-glass-border/30 text-center">
                <CardContent className="p-8">
                  <Globe className="w-12 h-12 text-accent mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-4">Platform Technologies</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div>React + TypeScript</div>
                    <div>Supabase backend</div>
                    <div>Mobile app ready</div>
                    <div>Telegram integration</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Live Events Highlight */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Badge variant="secondary" className="glass-panel mb-6 text-lg px-6 py-2">
              <Zap className="w-4 h-4 mr-2" />
              Live Event Revolution
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              <span className="text-aurora">Real-Time Concerts</span>
              <br />
              <span className="text-foreground">On The Blockchain</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Experience live music like never before with blockchain-secured ticketing, 
              real-time streaming, and interactive community features.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Card className="glass-panel border-glass-border/30 text-center h-full">
                <CardContent className="p-6">
                  <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-bold mb-3">WebRTC Streaming</h3>
                  <p className="text-sm text-muted-foreground">
                    Ultra-low latency live streaming technology for real-time artist-fan interaction
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Card className="glass-panel border-glass-border/30 text-center h-full">
                <CardContent className="p-6">
                  <Shield className="w-12 h-12 text-secondary mx-auto mb-4" />
                  <h3 className="text-lg font-bold mb-3">NFT Ticketing</h3>
                  <p className="text-sm text-muted-foreground">
                    Blockchain-secured event tickets as collectible NFTs with proof of attendance
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Card className="glass-panel border-glass-border/30 text-center h-full">
                <CardContent className="p-6">
                  <Users className="w-12 h-12 text-accent mx-auto mb-4" />
                  <h3 className="text-lg font-bold mb-3">Live Interaction</h3>
                  <p className="text-sm text-muted-foreground">
                    Real-time chat, live tipping, and community polls during performances
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Card className="glass-panel border-glass-border/30 text-center h-full">
                <CardContent className="p-6">
                  <DollarSign className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-bold mb-3">Direct Revenue</h3>
                  <p className="text-sm text-muted-foreground">
                    Artists earn 95% from ticket sales and live tips with instant TON payments
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Competitive Advantages */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-background/50">
        <div className="max-w-4xl mx-auto">
          <motion.h2 
            className="text-3xl font-bold text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Competitive Advantages
          </motion.h2>
          
          <div className="space-y-4">
            {competitiveAdvantages.map((advantage, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <Card className="glass-panel border-glass-border/30">
                  <CardContent className="p-6 flex items-center">
                    <Award className="w-6 h-6 text-primary mr-4 flex-shrink-0" />
                    <span className="text-muted-foreground">{advantage}</span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Financial Overview */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.h2 
            className="text-3xl font-bold text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Revenue Model & Financial Projections
          </motion.h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Card className="glass-panel border-glass-border/30">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold mb-6">Revenue Streams</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Transaction Fees (NFT & Tips)</span>
                      <Badge>5%</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Live Event Ticket Sales</span>
                      <Badge variant="outline">Revenue Share</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Premium Subscriptions</span>
                      <Badge variant="outline">Monthly</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Fan Club Platform Fees</span>
                      <Badge variant="outline">Recurring</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Partnership & Integrations</span>
                      <Badge variant="outline">B2B</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Card className="glass-panel border-glass-border/30">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold mb-6">Launch Targets</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Daily Active Users (Month 3)</span>
                      <span className="text-primary font-bold">10,000+</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Monthly Volume (Month 6)</span>
                      <span className="text-primary font-bold">$500K+</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Live Events Hosted (Month 12)</span>
                      <span className="text-primary font-bold">500+</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Verified Artists (Month 12)</span>
                      <span className="text-primary font-bold">1,000+</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>NFT Collections (Year 1)</span>
                      <span className="text-primary font-bold">50,000+</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <motion.section 
        className="py-16 px-4 sm:px-6 lg:px-8 text-center"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Music?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join us in building the future where every note tells a story, every collection has meaning, 
            and every fan becomes a stakeholder in the music they love.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="glass-button bg-primary/20 hover:bg-primary/30 text-primary border-primary/30">
              Partnership Opportunities
            </Button>
            <Button variant="outline" size="lg" className="glass-panel">
              Investment Inquiry
            </Button>
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default Marketing;