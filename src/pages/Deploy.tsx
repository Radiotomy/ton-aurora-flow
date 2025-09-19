import React from 'react';
import { MainnetDeploymentManager } from '@/components/MainnetDeploymentManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Rocket, Shield, Zap, Globe } from 'lucide-react';

export default function Deploy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container mx-auto py-8">
        {/* Header Section */}
        <div className="text-center mb-8 space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 rounded-full bg-primary/10 border-2 border-primary/20">
              <Rocket className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary-foreground to-secondary bg-clip-text text-transparent">
              Smart Contract Deployment
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Deploy AudioTon's core smart contracts to TON mainnet and launch your Web3 music platform
          </p>
        </div>

        {/* Benefits Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto p-3 rounded-full bg-success/10 border-2 border-success/20 w-fit">
                <Shield className="h-6 w-6 text-success" />
              </div>
              <CardTitle className="text-lg">Production Ready</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Audited smart contracts with built-in security features, multi-signature support, and immutable deployment for maximum trust.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto p-3 rounded-full bg-warning/10 border-2 border-warning/20 w-fit">
                <Zap className="h-6 w-6 text-warning" />
              </div>
              <CardTitle className="text-lg">Gas Optimized</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Efficient contract design with minimal transaction costs. Tips (~0.01 TON), NFT mints (~0.05 TON), memberships (~0.03 TON).
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto p-3 rounded-full bg-info/10 border-2 border-info/20 w-fit">
                <Globe className="h-6 w-6 text-info" />
              </div>
              <CardTitle className="text-lg">Global Scale</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Built on TON blockchain for worldwide accessibility with instant transactions and seamless mobile wallet integration.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Contract Overview */}
        <Card className="mb-8 border-secondary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Contract Architecture Overview
              <Badge variant="outline" className="ml-2">4 Core Contracts</Badge>
            </CardTitle>
            <CardDescription>
              AudioTon's smart contract ecosystem powering the Web3 music economy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <h3 className="font-semibold text-primary mb-2">Payment Processor</h3>
                  <p className="text-sm text-muted-foreground">
                    Handles all financial transactions including tips, NFT purchases, and fan club memberships with automated fee distribution.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/5 border border-secondary/20">
                  <h3 className="font-semibold text-secondary-foreground mb-2">NFT Collection</h3>
                  <p className="text-sm text-muted-foreground">
                    Manages music NFT minting, trading, and royalty distribution with support for multiple tiers and exclusive content.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
                  <h3 className="font-semibold text-accent-foreground mb-2">Fan Club System</h3>
                  <p className="text-sm text-muted-foreground">
                    Powers exclusive fan club memberships with tiered access, voting rights, and special content unlocking mechanisms.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/5 border border-muted/20">
                  <h3 className="font-semibold mb-2">Reward Distributor</h3>
                  <p className="text-sm text-muted-foreground">
                    Automatically distributes platform rewards to users based on engagement, streaming activity, and community participation.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Notice */}
        <Alert className="mb-8 border-warning/30 bg-warning/5">
          <Shield className="h-4 w-4" />
          <AlertTitle className="text-warning-foreground">Mainnet Deployment Notice</AlertTitle>
          <AlertDescription className="text-warning-foreground/80">
            <strong>This deploys to TON mainnet with real TON tokens.</strong> Ensure your wallet has sufficient balance (~3 TON total) and verify all configurations before proceeding. Deployed contracts are immutable and cannot be modified after deployment.
          </AlertDescription>
        </Alert>

        {/* Main Deployment Interface */}
        <MainnetDeploymentManager />
      </div>
    </div>
  );
}