import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Rocket, Shield, Globe, Zap, CheckCircle, AlertTriangle, Clock, ExternalLink, Wallet } from 'lucide-react';
import { useWeb3 } from '@/hooks/useWeb3';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { toast } from 'sonner';
import { SmartContractDeploymentService, MAINNET_DEPLOYMENT_CONFIG } from '@/services/smartContractDeployment';
import { hasPlaceholderContracts, getPlaceholderContractsList } from '@/contracts/compiled';

interface DeploymentStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  contractAddress?: string;
  txHash?: string;
  estimatedCost: string;
  priority: 'critical' | 'high' | 'medium';
}

const INITIAL_STEPS: DeploymentStep[] = [
  {
    id: 'payment-processor',
    title: 'Payment Processor Contract',
    description: 'Core payment handling for tips, NFT purchases, and fee distribution',
    status: 'pending',
    estimatedCost: '0.5 TON',
    priority: 'critical'
  },
  {
    id: 'nft-collection',
    title: 'NFT Collection Contract',
    description: 'Master contract for music NFT collection and minting',
    status: 'pending',
    estimatedCost: '0.5 TON',
    priority: 'critical'
  },
  {
    id: 'fan-club',
    title: 'Fan Club Contract',
    description: 'Manages exclusive fan club memberships and benefits',
    status: 'pending',
    estimatedCost: '0.4 TON',
    priority: 'high'
  },
  {
    id: 'reward-distributor',
    title: 'Reward Distributor Contract',
    description: 'Handles platform rewards and token distribution',
    status: 'pending',
    estimatedCost: '0.4 TON',
    priority: 'high'
  }
];

export const MainnetDeploymentManager: React.FC = () => {
  const [deploymentSteps, setDeploymentSteps] = useState<DeploymentStep[]>(INITIAL_STEPS);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentProgress, setDeploymentProgress] = useState(0);
  const [deploymentStatus, setDeploymentStatus] = useState<'idle' | 'deploying' | 'completed' | 'failed'>('idle');
  const [productionReadiness, setProductionReadiness] = useState<{ ready: boolean; issues: string[] }>({ ready: true, issues: [] });
  
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const isConnected = !!wallet;
  const walletAddress = wallet?.account?.address;
  
  // Calculate costs
  const totalEstimatedCost = deploymentSteps.reduce((sum, step) => sum + parseFloat(step.estimatedCost), 0);
  const minimumWalletBalance = totalEstimatedCost + 0.5; // Extra for fees

  // Check production readiness on mount
  useEffect(() => {
    const checkReadiness = () => {
      const issues: string[] = [];
      
      // Check environment variables
      if (!import.meta.env.VITE_TON_PROD_DEPLOY_ENABLED) {
        issues.push('Production deployment not enabled in environment');
      }
      
      // Check for placeholder contracts
      if (hasPlaceholderContracts()) {
        const placeholders = getPlaceholderContractsList();
        issues.push(`Placeholder contracts detected: ${placeholders.join(', ')}`);
      }
      
      setProductionReadiness({
        ready: issues.length === 0,
        issues
      });
    };

    checkReadiness();
  }, []);

  const updateStepStatus = useCallback((stepId: string, updates: Partial<DeploymentStep>) => {
    setDeploymentSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  }, []);

  const validateWalletBalance = async (): Promise<boolean> => {
    if (!wallet) return false;
    
    try {
      // Get wallet balance from TON Connect
      const balance = await tonConnectUI.getWallets();
      // This is a simplified check - in production you'd get actual balance
      return true; // Assume sufficient balance for now
    } catch (error) {
      console.error('Failed to check wallet balance:', error);
      return false;
    }
  };

  const deployContract = async (step: DeploymentStep, stepIndex: number): Promise<void> => {
    updateStepStatus(step.id, { status: 'in-progress' });
    
    try {
      let deploymentResult;
      
      switch (step.id) {
        case 'payment-processor':
          deploymentResult = await SmartContractDeploymentService.deployPaymentContract(
            MAINNET_DEPLOYMENT_CONFIG,
            tonConnectUI
          );
          break;
          
        case 'nft-collection':
          deploymentResult = await SmartContractDeploymentService.deployNFTCollectionContract(
            MAINNET_DEPLOYMENT_CONFIG,
            tonConnectUI
          );
          break;
          
        case 'fan-club':
          deploymentResult = await SmartContractDeploymentService.deployFanClubContract(
            MAINNET_DEPLOYMENT_CONFIG,
            tonConnectUI
          );
          break;
          
        case 'reward-distributor':
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
      
      setDeploymentProgress(((stepIndex + 1) / deploymentSteps.length) * 100);
      
      toast.success(`${step.title} deployed successfully!`, {
        description: `Address: ${deploymentResult.address.substring(0, 20)}...`
      });
      
    } catch (error) {
      updateStepStatus(step.id, { status: 'failed' });
      toast.error(`Failed to deploy ${step.title}`, {
        description: error instanceof Error ? error.message : 'Deployment failed'
      });
      throw error;
    }
  };

  const startMainnetDeployment = async () => {
    if (!isConnected || !wallet) {
      toast.error('Please connect your TON wallet first');
      return;
    }

    // Validate wallet balance
    const hasBalance = await validateWalletBalance();
    if (!hasBalance) {
      toast.error(`Insufficient wallet balance. Minimum ${minimumWalletBalance} TON required.`);
      return;
    }

    setIsDeploying(true);
    setDeploymentStatus('deploying');
    setDeploymentProgress(0);
    
    try {
      toast.info('Starting mainnet deployment...', {
        description: 'Deploying all AudioTon smart contracts to TON mainnet'
      });

      // Deploy contracts sequentially to avoid nonce conflicts
      for (let i = 0; i < deploymentSteps.length; i++) {
        const step = deploymentSteps[i];
        await deployContract(step, i);
        
        // Small delay between deployments
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      setDeploymentStatus('completed');
      
      toast.success('🎉 Mainnet deployment completed!', {
        description: `All ${deploymentSteps.length} contracts deployed successfully`,
        duration: 10000
      });

    } catch (error) {
      setDeploymentStatus('failed');
      toast.error('Deployment failed', {
        description: 'Check console for details and try again'
      });
      console.error('Deployment error:', error);
    } finally {
      setIsDeploying(false);
    }
  };

  const getStepIcon = (status: DeploymentStep['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in-progress': return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'failed': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default: return <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />;
    }
  };

  const getPriorityBadgeVariant = (priority: DeploymentStep['priority']) => {
    switch (priority) {
      case 'critical': return 'destructive' as const;
      case 'high': return 'secondary' as const;
      case 'medium': return 'outline' as const;
    }
  };

  const completedSteps = deploymentSteps.filter(step => step.status === 'completed').length;
  const failedSteps = deploymentSteps.filter(step => step.status === 'failed').length;
  const isDeploymentReady = productionReadiness.ready && isConnected;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Rocket className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Mainnet Contract Deployment</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Deploy AudioTon's production smart contracts to TON mainnet
        </p>
        
        {/* Network Info */}
        <div className="flex items-center justify-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <Globe className="h-4 w-4" />
            <span>TON Mainnet</span>
          </div>
          <div className="flex items-center space-x-1">
            <Wallet className="h-4 w-4" />
            <span>{isConnected ? 'Connected' : 'Not Connected'}</span>
          </div>
        </div>
      </div>

      {/* Production Readiness Alert */}
      {!productionReadiness.ready && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Production Not Ready:</strong> {productionReadiness.issues.join(', ')}
            <br />
            <span className="text-sm mt-1 block">
              Replace placeholder contracts with real compiled bytecode before mainnet deployment.
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Wallet Status */}
      {!isConnected && (
        <Alert>
          <Wallet className="h-4 w-4" />
          <AlertDescription>
            Connect your TON wallet to proceed with mainnet deployment. 
            Minimum balance required: <strong>{minimumWalletBalance.toFixed(1)} TON</strong>
          </AlertDescription>
        </Alert>
      )}

      {/* Pre-deployment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Deployment Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{deploymentSteps.length}</div>
              <div className="text-sm text-muted-foreground">Contracts</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{totalEstimatedCost.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Total TON</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">Mainnet</div>
              <div className="text-sm text-muted-foreground">Network</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">5%</div>
              <div className="text-sm text-muted-foreground">Fee %</div>
            </div>
          </div>
          
          <div className="text-center text-sm text-muted-foreground pt-2 border-t">
            Treasury Address: <code className="text-xs">EQD...abc123</code> (Demo)
          </div>
        </CardContent>
      </Card>

      {/* Deployment Progress */}
      {(isDeploying || completedSteps > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Deployment Progress</CardTitle>
            <CardDescription>
              {completedSteps}/{deploymentSteps.length} contracts deployed
              {failedSteps > 0 && ` (${failedSteps} failed)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={deploymentProgress} className="w-full" />
            <div className="flex justify-between text-sm text-muted-foreground mt-2">
              <span>{Math.round(deploymentProgress)}% complete</span>
              <span>Status: {deploymentStatus}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deployment Steps */}
      <div className="space-y-4">
        {deploymentSteps.map((step, index) => (
          <Card key={step.id} className={step.status === 'in-progress' ? 'ring-2 ring-primary' : ''}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  {getStepIcon(step.status)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold">{step.title}</h3>
                      <Badge variant={getPriorityBadgeVariant(step.priority)}>
                        {step.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                    
                    {step.contractAddress && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="text-muted-foreground min-w-[60px]">Address:</span>
                          <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                            {step.contractAddress}
                          </code>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                        {step.txHash && (
                          <div className="flex items-center space-x-2 text-sm">
                            <span className="text-muted-foreground min-w-[60px]">TX Hash:</span>
                            <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                              {step.txHash.substring(0, 20)}...
                            </code>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-right ml-4">
                  <div className="text-sm font-medium">{step.estimatedCost}</div>
                  <div className="text-xs text-muted-foreground">Est. cost</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Warning */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>⚠️ Mainnet Deployment Warning:</strong> This will deploy contracts to TON mainnet using real tokens. 
          Estimated total cost: <strong>{totalEstimatedCost.toFixed(1)} TON</strong>. 
          Ensure contracts are audited and tested.
        </AlertDescription>
      </Alert>

      {/* Deploy Button with Confirmation Dialog */}
      <div className="flex justify-center">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              disabled={!isDeploymentReady || isDeploying}
              size="lg"
              className="w-full md:w-auto"
            >
              {isDeploying ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Deploying to Mainnet...
                </>
              ) : !productionReadiness.ready ? (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Fix Production Issues
                </>
              ) : !isConnected ? (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet First
                </>
              ) : (
                <>
                  <Rocket className="mr-2 h-4 w-4" />
                  Deploy to TON Mainnet
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Mainnet Deployment</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to deploy {deploymentSteps.length} smart contracts to TON mainnet.
                <br /><br />
                <strong>Total estimated cost: {totalEstimatedCost.toFixed(1)} TON</strong>
                <br />
                <strong>Connected wallet: </strong>
                <code className="text-xs">{walletAddress?.substring(0, 20)}...</code>
                <br /><br />
                This action cannot be undone. Are you sure you want to proceed?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={startMainnetDeployment}>
                Deploy Contracts
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Completion Message */}
      {deploymentStatus === 'completed' && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-700 dark:text-green-300">
              <CheckCircle className="h-5 w-5" />
              <span>🎉 Deployment Complete!</span>
            </CardTitle>
            <CardDescription className="text-green-600 dark:text-green-400">
              All AudioTon smart contracts successfully deployed to TON mainnet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Next steps:</strong>
              </p>
              <ul className="text-sm space-y-1 ml-4">
                <li>• Update production configuration with contract addresses</li>
                <li>• Verify contract functionality on mainnet</li>
                <li>• Begin user onboarding and marketing</li>
                <li>• Monitor contract performance and user activity</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};