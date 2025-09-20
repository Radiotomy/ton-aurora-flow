import React from 'react';
import { MainnetDeploymentManager } from '@/components/MainnetDeploymentManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Rocket, Shield, Globe, Zap, Info } from 'lucide-react';

export default function MainnetDeploy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 space-y-8">
        
        {/* Platform Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Info className="h-5 w-5" />
              <span>AudioTon Platform Overview</span>
            </CardTitle>
            <CardDescription>
              Ready for mainnet deployment with production-grade features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Shield className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="font-semibold">Security Audited</div>
                <div className="text-sm text-muted-foreground">Smart contracts reviewed</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Globe className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <div className="font-semibold">TON Integration</div>
                <div className="text-sm text-muted-foreground">Full blockchain support</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Zap className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <div className="font-semibold">High Performance</div>
                <div className="text-sm text-muted-foreground">Optimized for scale</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Rocket className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <div className="font-semibold">Ready to Launch</div>
                <div className="text-sm text-muted-foreground">Production configuration</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Highlights */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Core Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">7-Band Audio EQ</span>
                <Badge variant="secondary">Ready</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Audius Integration</span>
                <Badge variant="secondary">Ready</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">TON Wallet Connect</span>
                <Badge variant="secondary">Ready</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Real-time Analytics</span>
                <Badge variant="secondary">Ready</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Web3 Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">NFT Minting</span>
                <Badge variant="outline">Contracts</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Fan Clubs</span>
                <Badge variant="outline">Contracts</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Artist Tips</span>
                <Badge variant="outline">Contracts</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Cross-chain Bridge</span>
                <Badge variant="secondary">Ready</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Platform Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Telegram Mini App</span>
                <Badge variant="secondary">Configured</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">TON Sites</span>
                <Badge variant="secondary">Configured</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Mobile PWA</span>
                <Badge variant="secondary">Ready</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Voice Search</span>
                <Badge variant="secondary">Ready</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Launch Readiness Alert */}
        <Alert>
          <Rocket className="h-4 w-4" />
          <AlertDescription>
            <strong>Platform Launch Ready:</strong> AudioTon has completed development with all core features implemented. 
            The platform is now ready for smart contract deployment to TON mainnet and public launch.
          </AlertDescription>
        </Alert>

        {/* Main Deployment Interface */}
        <MainnetDeploymentManager />
      </div>
    </div>
  );
}