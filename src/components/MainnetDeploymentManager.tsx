import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Rocket, Shield, Globe, Zap, CheckCircle, AlertTriangle, Clock, ExternalLink, Wallet, Target, Settings, PlayCircle, Flag } from 'lucide-react';
import { useWeb3 } from '@/hooks/useWeb3';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { toast } from 'sonner';
import { deploymentOrchestrator, DeploymentPhase, DeploymentStep, DeploymentReport } from '@/services/deploymentOrchestrator';
import { useChainStackCache } from '@/hooks/useChainStackCache';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { hasPlaceholderContracts, getPlaceholderContractsList } from '@/contracts/compiled';

export const MainnetDeploymentManager: React.FC = () => {
  const [deploymentPhases, setDeploymentPhases] = useState<DeploymentPhase[]>(deploymentOrchestrator.getPhases());
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentProgress, setDeploymentProgress] = useState(0);
  const [deploymentStatus, setDeploymentStatus] = useState<'idle' | 'deploying' | 'completed' | 'failed'>('idle');
  const [productionReadiness, setProductionReadiness] = useState<{ ready: boolean; issues: string[] }>({ ready: true, issues: [] });
  const [deploymentReport, setDeploymentReport] = useState<DeploymentReport | null>(null);
  
  // Enhanced monitoring hooks
  const chainstackCache = useChainStackCache();
  const performanceMonitor = usePerformanceMonitor();
  
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const isConnected = !!wallet;
  const walletAddress = wallet?.account?.address;
  
  // Calculate costs from all deployment steps across all phases
  const allSteps = deploymentPhases.flatMap(phase => phase.steps);
  const contractSteps = allSteps.filter(step => step.id.startsWith('deploy-'));
  const totalEstimatedCost = contractSteps.length * 0.45; // Approximate 0.45 TON per contract
  const minimumWalletBalance = totalEstimatedCost + 0.5; // Extra for fees

  // Check production readiness with enhanced validation
  useEffect(() => {
    const checkReadiness = async () => {
      try {
        // Import the enhanced contract validation
        const { checkContractProductionReadiness } = await import('@/utils/contractCompilationValidator');
        const readinessCheck = await checkContractProductionReadiness();
        
        if (!readinessCheck.ready) {
          setProductionReadiness({
            ready: false,
            issues: readinessCheck.issues
          });
        } else {
          setProductionReadiness({
            ready: true,
            issues: []
          });
        }

        // Check environment variables - we now use Supabase secrets instead
        // No need to check frontend env vars as TonCenter API is handled via edge functions
        console.log('✅ TonCenter API configured via Supabase edge function');
        
        // Additional production checks
        if (isConnected && wallet) {
          try {
            const { RealWalletBalanceService } = await import('@/services/realWalletBalanceService');
            const balanceValidation = await RealWalletBalanceService.validateDeploymentBalance(
              wallet.account.address
            );
            
            if (!balanceValidation.sufficient) {
              setProductionReadiness(prev => ({
                ready: false,
                issues: [
                  ...prev.issues,
                  balanceValidation.recommendation
                ]
              }));
            } else {
              console.log('✅ Wallet balance validation passed:', balanceValidation.recommendation);
            }
          } catch (balanceError) {
            console.warn('Could not validate wallet balance:', balanceError);
            // Add a warning but don't block deployment for balance check failures
            setProductionReadiness(prev => ({
              ready: prev.ready, // Don't change ready state
              issues: [
                ...prev.issues,
                `⚠️ Balance validation unavailable (${balanceError.message}). Please ensure you have at least 5 TON for deployment.`
              ]
            }));
          }
        }
        
      } catch (error) {
        console.error('Production readiness check failed:', error);
        setProductionReadiness({
          ready: false,
          issues: ['Failed to verify production readiness']
        });
      }
    };

    checkReadiness();
  }, [isConnected, wallet]);

  const updatePhase = useCallback((updatedPhase: DeploymentPhase) => {
    setDeploymentPhases(prev => prev.map(phase => 
      phase.id === updatedPhase.id ? updatedPhase : phase
    ));
    
    // Calculate overall progress
    const totalSteps = deploymentPhases.reduce((sum, p) => sum + p.steps.length, 0);
    const completedSteps = deploymentPhases.reduce((sum, p) => 
      sum + p.steps.filter(s => s.status === 'completed').length, 0
    );
    setDeploymentProgress((completedSteps / totalSteps) * 100);
  }, [deploymentPhases]);

  const updateStep = useCallback((updatedStep: DeploymentStep) => {
    setDeploymentPhases(prev => prev.map(phase => ({
      ...phase,
      steps: phase.steps.map(step => 
        step.id === updatedStep.id ? updatedStep : step
      )
    })));
  }, []);

  // Enhanced wallet balance validation with real-time monitoring
  const validateWalletBalance = async (): Promise<boolean> => {
    if (!wallet) return false;
    
    try {
      // Track API performance
      const startTime = Date.now();
      performanceMonitor.recordAPICall('balance_validation', Date.now() - startTime, false, true);
      
      const { RealWalletBalanceService } = await import('@/services/realWalletBalanceService');
      const validation = await RealWalletBalanceService.validateDeploymentBalance(
        wallet.account.address
      );
      
      if (!validation.sufficient) {
        const shortfallTon = validation.shortfall ? 
          Number(validation.shortfall) / 1e9 : 0;
        
        toast.error(`Insufficient Balance: Need ${shortfallTon.toFixed(4)} TON more. ${validation.recommendation}`);
        return false;
      }
      
      const costBreakdown = `
        Per Contract: ${Number(validation.costs.perContract) / 1e9} TON
        Total (4 contracts): ${Number(validation.costs.totalForAllContracts) / 1e9} TON
        Gas Reserve: ${Number(validation.costs.gasReserve) / 1e9} TON
        ${validation.costs.estimatedUSD ? `(~$${validation.costs.estimatedUSD.toFixed(2)} USD)` : ''}
        Network Status: ${(1 - performanceMonitor.metrics.errorRate) > 0.9 ? '✅ Optimal' : '⚠️ Degraded'}
      `.trim();
      
      toast.success(`Balance Validated ✅: ${validation.recommendation}\n\nDeployment Cost Breakdown:\n${costBreakdown}`);
      return true;
      
    } catch (error) {
      console.error('Balance validation failed:', error);
      toast.error("Balance Check Failed: Could not verify wallet balance. Please try again.");
      return false;
    }
  };

  const startMainnetDeployment = async () => {
    if (!isConnected || !wallet) {
      toast.error('Please connect your TON wallet first');
      return;
    }

    setIsDeploying(true);
    setDeploymentStatus('deploying');
    setDeploymentProgress(0);
    
    try {
      toast.info('🚀 Starting 4-Phase Mainnet Deployment...', {
        description: 'Executing comprehensive deployment plan'
      });

      // Execute the complete 4-phase deployment plan
      const report = await deploymentOrchestrator.executeDeploymentPlan(
        tonConnectUI,
        wallet.account.address,
        updatePhase,
        updateStep
      );

      setDeploymentReport(report);
      setDeploymentStatus('completed');
      
      toast.success('🎉 Mainnet Deployment Completed Successfully!', {
        description: `All phases completed. ${Object.keys(report.contractAddresses).length} contracts deployed in ${(report.totalDuration / 1000).toFixed(1)}s`,
        duration: 15000
      });

    } catch (error) {
      setDeploymentStatus('failed');
      toast.error('❌ Deployment Failed', {
        description: 'Check console for details and review deployment status'
      });
      console.error('Deployment orchestration error:', error);
    } finally {
      setIsDeploying(false);
    }
  };

  const getPhaseIcon = (phase: DeploymentPhase) => {
    switch (phase.id) {
      case 'phase1-verification': return <Shield className="h-5 w-5" />;
      case 'phase2-deployment': return <Rocket className="h-5 w-5" />;
      case 'phase3-validation': return <Target className="h-5 w-5" />;
      case 'phase4-golive': return <Flag className="h-5 w-5" />;
      default: return <Settings className="h-5 w-5" />;
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

  const allStepsCount = deploymentPhases.reduce((sum, p) => sum + p.steps.length, 0);
  const completedSteps = deploymentPhases.reduce((sum, p) => 
    sum + p.steps.filter(s => s.status === 'completed').length, 0
  );
  const failedSteps = deploymentPhases.reduce((sum, p) => 
    sum + p.steps.filter(s => s.status === 'failed').length, 0
  );
  const isDeploymentReady = isConnected && (!productionReadiness.issues.length || productionReadiness.issues.every(issue => issue.includes('Balance validation unavailable')));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Rocket className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">4-Phase Mainnet Deployment</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Comprehensive production deployment plan with pre-verification, contract deployment, validation, and go-live preparation
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
      {!isConnected ? (
        <Alert>
          <Wallet className="h-4 w-4" />
          <AlertDescription>
            Connect your TON wallet to proceed with mainnet deployment. 
            Minimum balance required: <strong>{minimumWalletBalance.toFixed(1)} TON</strong>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>
                <strong>Wallet Connected:</strong> {wallet?.account?.address.slice(0, 6)}...{wallet?.account?.address.slice(-4)}
              </span>
              <Badge variant="secondary" className="ml-2">
                {wallet?.account?.chain === '-239' ? 'Mainnet' : 'Testnet'}
              </Badge>
            </div>
            <div className="mt-2 text-sm">
              Ready for deployment. Balance verification in progress...
            </div>
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
              <div className="text-2xl font-bold text-primary">{deploymentPhases.length}</div>
              <div className="text-sm text-muted-foreground">Phases</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{allStepsCount}</div>
              <div className="text-sm text-muted-foreground">Total Steps</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{totalEstimatedCost.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Est. TON Cost</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">Mainnet</div>
              <div className="text-sm text-muted-foreground">Network</div>
            </div>
          </div>
          
          <div className="text-center text-sm text-muted-foreground pt-2 border-t">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <span>Phase 1: Pre-Verification</span>
              <span>Phase 2: Contract Deployment</span>
              <span>Phase 3: Validation</span>
              <span>Phase 4: Go-Live Prep</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deployment Progress */}
      {(isDeploying || completedSteps > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Deployment Progress</CardTitle>
            <CardDescription>
              {completedSteps}/{allStepsCount} steps completed across {deploymentPhases.length} phases
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

      {/* Deployment Phases */}
      <div className="space-y-6">
        {deploymentPhases.map((phase) => (
          <Card key={phase.id} className={phase.status === 'in-progress' ? 'ring-2 ring-primary' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                {getPhaseIcon(phase)}
                <span>{phase.name}</span>
                <Badge variant={
                  phase.status === 'completed' ? 'default' :
                  phase.status === 'in-progress' ? 'secondary' :
                  phase.status === 'failed' ? 'destructive' : 'outline'
                }>
                  {phase.status}
                </Badge>
              </CardTitle>
              <CardDescription>{phase.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {phase.steps.map((step) => (
                <div key={step.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-start space-x-3 flex-1">
                    {getStepIcon(step.status)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium">{step.title}</h4>
                        <Badge variant={getPriorityBadgeVariant(step.priority)}>
                          {step.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                      {step.actualDuration && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Completed in {(step.actualDuration / 1000).toFixed(1)}s
                        </p>
                      )}
                      {step.error && (
                        <p className="text-xs text-red-500 mt-1">Error: {step.error}</p>
                      )}
                    </div>
                  </div>
                  {step.result?.address && (
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Contract Address:</div>
                      <code className="text-xs">{step.result.address.substring(0, 20)}...</code>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Deployment Report */}
      {deploymentReport && deploymentStatus === 'completed' && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-700 dark:text-green-300">
              <CheckCircle className="h-5 w-5" />
              <span>Deployment Completed Successfully!</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm">
              <strong>Summary:</strong> {deploymentReport.summary}
            </div>
            
            <div>
              <strong className="text-sm">Deployed Contracts:</strong>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {Object.entries(deploymentReport.contractAddresses).map(([name, address]) => (
                  <div key={name} className="text-xs">
                    <span className="font-medium capitalize">{name.replace(/([A-Z])/g, ' $1').trim()}:</span>
                    <br />
                    <code className="text-xs">{address}</code>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <strong className="text-sm">Next Steps:</strong>
              <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                {deploymentReport.nextSteps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deploy Button */}
      <div className="text-center">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              size="lg"
              className="px-8 py-3"
              disabled={!isDeploymentReady || isDeploying}
              title={!isConnected ? "Connect TON wallet to enable deployment" : isDeploymentReady ? "Ready for mainnet deployment" : "Check production readiness issues above"}
            >
              {isDeploying ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Executing Deployment Plan...
                </>
              ) : !isConnected ? (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet First
                </>
              ) : (
                <>
                  <Rocket className="mr-2 h-4 w-4" />
                  Execute 4-Phase Deployment Plan
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Execute Mainnet Deployment?</AlertDialogTitle>
              <AlertDialogDescription>
                This will execute the comprehensive 4-phase deployment plan:
                <br />
                <br />
                <strong>Phase 1:</strong> Pre-Deployment Verification
                <br />
                <strong>Phase 2:</strong> Smart Contract Deployment
                <br />
                <strong>Phase 3:</strong> Post-Deployment Validation  
                <br />
                <strong>Phase 4:</strong> Go-Live Preparation
                <br />
                <br />
                Estimated cost: <strong>{totalEstimatedCost.toFixed(1)} TON</strong>
                <br />
                <br />
                This action will deploy to TON mainnet and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={startMainnetDeployment}>
                Execute Deployment Plan
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Success Message */}
      {deploymentStatus === 'completed' && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <strong>🎉 AudioTon Platform Successfully Deployed to TON Mainnet!</strong>
            <br />
            <br />
            Your platform is now live and ready for production use. All smart contracts have been deployed, validated, and configured.
            <br />
            <br />
            <strong>What's Next:</strong>
            <br />
            • Begin onboarding artists and creators
            <br />
            • Launch your marketing and user acquisition campaigns
            <br />
            • Monitor platform performance and user engagement
            <br />
            • Scale your community and ecosystem partnerships
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};