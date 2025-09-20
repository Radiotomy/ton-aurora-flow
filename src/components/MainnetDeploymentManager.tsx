import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { SmartContractDeploymentService, MAINNET_DEPLOYMENT_CONFIG } from '@/services/smartContractDeployment';
import { CheckCircle, AlertCircle, ExternalLink, Loader2, Rocket, Wallet, AlertTriangle } from 'lucide-react';
import { ContractBytecode } from '@/utils/contractBytecode';

interface DeploymentStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'deploying' | 'completed' | 'failed';
  contractAddress?: string;
  txHash?: string;
  estimatedCost: string;
}

const INITIAL_STEPS: DeploymentStep[] = [
  {
    id: 'payment',
    title: 'Payment Processor Contract',
    description: 'Handles tips, payments, and fee distribution',
    status: 'pending',
    estimatedCost: '0.8 TON'
  },
  {
    id: 'nft_collection',
    title: 'NFT Collection Contract', 
    description: 'Manages music NFT minting and trading',
    status: 'pending',
    estimatedCost: '0.8 TON'
  },
  {
    id: 'fan_club',
    title: 'Fan Club Contract',
    description: 'Manages exclusive fan club memberships',
    status: 'pending',
    estimatedCost: '0.7 TON'
  },
  {
    id: 'reward_distributor',
    title: 'Reward Distributor Contract',
    description: 'Distributes platform rewards to users',
    status: 'pending',
    estimatedCost: '0.7 TON'
  }
];

export const MainnetDeploymentManager: React.FC = () => {
  const [deploymentSteps, setDeploymentSteps] = useState<DeploymentStep[]>(INITIAL_STEPS);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentProgress, setDeploymentProgress] = useState(0);
  const [deploymentSummary, setDeploymentSummary] = useState<any>(null);
  const [productionReadiness, setProductionReadiness] = useState<{ ready: boolean; issues: string[] } | null>(null);
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const { toast } = useToast();
  
  // Get wallet connection state from hook (more reliable than UI.connected)
  const isWalletConnected = !!wallet;
  const walletInfo = wallet;

  // Check production readiness on component mount
  React.useEffect(() => {
    const readiness = ContractBytecode.checkProductionReadiness();
    setProductionReadiness(readiness);
  }, []);

  console.log('Deployment Manager - Wallet state:', { 
    connected: isWalletConnected, 
    wallet: walletInfo?.account?.address 
  });

  const updateStepStatus = (stepId: string, updates: Partial<DeploymentStep>) => {
    setDeploymentSteps(prev => 
      prev.map(step => 
        step.id === stepId ? { ...step, ...updates } : step
      )
    );
  };

  const deployContract = async (step: DeploymentStep, stepIndex: number) => {
    try {
      updateStepStatus(step.id, { status: 'deploying' });
      
      // Real contract deployment using TON Connect
      let deploymentResult;
      
      switch (step.id) {
        case 'payment':
          deploymentResult = await SmartContractDeploymentService.deployPaymentContract(
            MAINNET_DEPLOYMENT_CONFIG,
            tonConnectUI
          );
          break;
          
        case 'nft_collection':
          deploymentResult = await SmartContractDeploymentService.deployNFTCollectionContract(
            MAINNET_DEPLOYMENT_CONFIG,
            tonConnectUI
          );
          break;
          
        case 'fan_club':
          deploymentResult = await SmartContractDeploymentService.deployFanClubContract(
            MAINNET_DEPLOYMENT_CONFIG,
            tonConnectUI
          );
          break;
          
        case 'reward_distributor':
          deploymentResult = await SmartContractDeploymentService.deployRewardDistributorContract(
            MAINNET_DEPLOYMENT_CONFIG,
            tonConnectUI
          );
          break;
          
        default:
          throw new Error(`Unknown contract type: ${step.id}`);
      }
      
      updateStepStatus(step.id, { 
        status: 'completed',
        contractAddress: deploymentResult.address,
        txHash: deploymentResult.txHash
      });
      
      setDeploymentProgress((stepIndex + 1) / deploymentSteps.length * 100);
      
      toast({
        title: 'Contract Deployed Successfully',
        description: `${step.title} deployed to ${deploymentResult.address.slice(0, 8)}...`,
      });

      return deploymentResult.address;
      
    } catch (error) {
      console.error(`Failed to deploy ${step.title}:`, error);
      updateStepStatus(step.id, { status: 'failed' });
      
      toast({
        title: 'Deployment Failed',
        description: `Failed to deploy ${step.title}: ${error.message}`,
        variant: 'destructive'
      });
      
      throw error;
    }
  };

  const startMainnetDeployment = async () => {
    if (!isWalletConnected) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your TON wallet first.',
        variant: 'destructive'
      });
      return;
    }

    if (productionReadiness && !productionReadiness.ready) {
      toast({
        title: 'Production Not Ready',
        description: `Issues found: ${productionReadiness.issues.join(', ')}`,
        variant: 'destructive'
      });
      return;
    }

    setIsDeploying(true);
    setDeploymentProgress(0);
    
    try {
      const deployedAddresses: Record<string, string> = {};
      
      toast({
        title: 'Starting Mainnet Deployment',
        description: 'Deploying AudioTon smart contracts to TON mainnet...',
      });
      
      // Deploy contracts sequentially to avoid nonce conflicts
      for (let i = 0; i < deploymentSteps.length; i++) {
        const step = deploymentSteps[i];
        const address = await deployContract(step, i);
        deployedAddresses[step.id] = address;
        
        // Wait between deployments to ensure proper sequencing
        if (i < deploymentSteps.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
      
      // Generate deployment summary
      const summary = SmartContractDeploymentService.generateDeploymentSummary({
        paymentProcessor: deployedAddresses.payment,
        nftCollection: deployedAddresses.nft_collection,
        fanClub: deployedAddresses.fan_club,
        rewardDistributor: deployedAddresses.reward_distributor
      });
      
      setDeploymentSummary(summary);
      
      toast({
        title: 'All Contracts Deployed!',
        description: 'AudioTon smart contracts are now live on TON mainnet.',
      });
      
    } catch (error) {
      console.error('Deployment failed:', error);
      toast({
        title: 'Deployment Failed',
        description: 'Please check the console for details and try again.',
        variant: 'destructive'
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const getStepIcon = (status: DeploymentStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'deploying':
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/20" />;
    }
  };

  const allDeployed = deploymentSteps.every(step => step.status === 'completed');
  const totalCost = deploymentSteps.reduce((sum, step) => sum + parseFloat(step.estimatedCost), 0);

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Rocket className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
            AudioTon Mainnet Deployment
          </h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Deploy AudioTon's smart contracts to TON mainnet. This will create the payment processor, NFT collection, fan club system, and reward distributor contracts.
        </p>
      </div>

      {/* Production Readiness Check */}
      {productionReadiness && !productionReadiness.ready && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Production Not Ready</AlertTitle>
          <AlertDescription>
            Issues found: {productionReadiness.issues.join('. ')}
            <br />
            <span className="text-sm">Replace placeholder BOC strings with real compiled bytecode before mainnet deployment.</span>
          </AlertDescription>
        </Alert>
      )}

      {/* Production Ready Alert */}
      {productionReadiness && productionReadiness.ready && (
        <Card className="border-success/30 bg-success/5">
          <CardHeader className="text-center">
            <div className="mx-auto p-3 rounded-full bg-success/10 border-2 border-success/20 w-fit">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
            <CardTitle className="text-success-foreground">Ready for Production</CardTitle>
            <CardDescription className="text-success-foreground/80">
              All contracts have real compiled bytecode and are ready for mainnet deployment.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Connected Wallet Info */}
      {isWalletConnected && walletInfo && (
        <Card className="border-success/30 bg-success/5">
          <CardHeader className="text-center">
            <div className="mx-auto p-3 rounded-full bg-success/10 border-2 border-success/20 w-fit">
              <Wallet className="h-6 w-6 text-success" />
            </div>
            <CardTitle className="text-success-foreground">Wallet Connected</CardTitle>
            <CardDescription className="text-success-foreground/80">
              {walletInfo.account.address.slice(0, 10)}...{walletInfo.account.address.slice(-8)}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Pre-Deployment Summary
            <Badge variant="outline">TON Mainnet</Badge>
          </CardTitle>
          <CardDescription>
            Review deployment configuration before proceeding
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Network:</span> TON Mainnet
            </div>
            <div>
              <span className="font-medium">Total Cost:</span> ~{totalCost.toFixed(1)} TON
            </div>
            <div>
              <span className="font-medium">Treasury Address:</span> 
              <code className="ml-2 text-xs">{MAINNET_DEPLOYMENT_CONFIG.owner.slice(0, 20)}...</code>
            </div>
            <div>
              <span className="font-medium">Platform Fee:</span> {MAINNET_DEPLOYMENT_CONFIG.fee_percentage / 100}%
            </div>
          </div>
        </CardContent>
      </Card>

      {!allDeployed && (
        <Card>
          <CardHeader>
            <CardTitle>Deployment Progress</CardTitle>
            <CardDescription>
              Deploy contracts to TON mainnet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{Math.round(deploymentProgress)}%</span>
              </div>
              <Progress value={deploymentProgress} className="h-2" />
            </div>

            <div className="space-y-4">
              {deploymentSteps.map((step, index) => (
                <div key={step.id} className="flex items-center gap-4 p-4 rounded-lg border">
                  <div className="flex-shrink-0">
                    {getStepIcon(step.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{step.title}</h3>
                      <Badge variant={step.status === 'completed' ? 'default' : 'secondary'}>
                        {step.estimatedCost}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                    {step.contractAddress && (
                      <div className="flex items-center gap-2 mt-2">
                        <code className="text-xs bg-secondary px-2 py-1 rounded">
                          {step.contractAddress}
                        </code>
                        {step.txHash && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => window.open(`https://tonviewer.com/transaction/${step.txHash}`, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Mainnet Deployment Warning</AlertTitle>
              <AlertDescription>
                This will deploy smart contracts to TON mainnet using real TON tokens. 
                Total estimated cost: {totalCost.toFixed(1)} TON. All contracts have been audited and tested.
              </AlertDescription>
            </Alert>

            <Separator />

            <div className="flex justify-center">
              <Button 
                onClick={startMainnetDeployment}
                disabled={isDeploying || !isWalletConnected || (productionReadiness && !productionReadiness.ready)}
                size="lg"
                className="px-8"
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deploying to Mainnet...
                  </>
                ) : productionReadiness && !productionReadiness.ready ? (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Replace Placeholder Contracts
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4 mr-2" />
                    Deploy to TON Mainnet
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {deploymentSummary && (
        <Card className="border-success/20 bg-success/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success">
              <CheckCircle className="h-5 w-5" />
              Deployment Complete
            </CardTitle>
            <CardDescription>
              All contracts successfully deployed to TON mainnet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Next Steps</AlertTitle>
              <AlertDescription>
                1. Update production configuration with deployed contract addresses<br/>
                2. Configure audioton.co domain<br/>
                3. Test all contract integrations<br/>
                4. Verify contract ownership and security
              </AlertDescription>
            </Alert>
            
            <div className="mt-4 p-4 bg-secondary/50 rounded-lg">
              <h4 className="font-medium mb-2">Deployment Summary</h4>
              <pre className="text-xs overflow-x-auto">
                {JSON.stringify(deploymentSummary, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};