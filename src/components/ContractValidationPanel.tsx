/**
 * Contract Validation Panel Component
 * Displays contract compilation validation results and production readiness
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  FileCode, 
  Zap,
  Cpu,
  Database
} from 'lucide-react';
import { validateContractCompilation, checkContractProductionReadiness } from '@/utils/contractCompilationValidator';

interface ValidationResult {
  contractName: string;
  isValid: boolean;
  hasRealBytecode: boolean;
  size: number;
  sourceHash: string;
  errors: string[];
  warnings: string[];
}

interface CompilationTestResult {
  success: boolean;
  contractsValidated: number;
  totalContracts: number;
  results: ValidationResult[];
  summary: {
    realContracts: number;
    placeholderContracts: number;
    failedValidations: number;
    totalSizeBytes: number;
  };
  recommendations: string[];
}

export const ContractValidationPanel = () => {
  const [validationResult, setValidationResult] = useState<CompilationTestResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [productionReadiness, setProductionReadiness] = useState<any>(null);

  // Run initial validation on component mount
  useEffect(() => {
    runValidation();
    checkReadiness();
  }, []);

  const runValidation = async () => {
    setIsValidating(true);
    try {
      const result = await validateContractCompilation();
      setValidationResult(result);
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const checkReadiness = async () => {
    try {
      const readiness = await checkContractProductionReadiness();
      setProductionReadiness(readiness);
    } catch (error) {
      console.error('Readiness check failed:', error);
    }
  };

  const getContractIcon = (contractName: string) => {
    switch (contractName) {
      case 'payment':
        return <Zap className="w-4 h-4" />;
      case 'nft-collection':
        return <FileCode className="w-4 h-4" />;
      case 'fan-club':
        return <Database className="w-4 h-4" />;
      case 'reward-distributor':
        return <Cpu className="w-4 h-4" />;
      default:
        return <FileCode className="w-4 h-4" />;
    }
  };

  const getStatusColor = (result: ValidationResult) => {
    if (!result.isValid) return 'destructive';
    if (!result.hasRealBytecode) return 'secondary';
    return 'default';
  };

  const getStatusText = (result: ValidationResult) => {
    if (!result.isValid) return 'INVALID';
    if (!result.hasRealBytecode) return 'PLACEHOLDER';
    return 'REAL';
  };

  const formatSize = (bytes: number) => {
    return (bytes / 1024).toFixed(2) + ' KB';
  };

  if (!validationResult) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            Initializing Contract Validation...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {validationResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              Contract Compilation Validation
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={runValidation}
              disabled={isValidating}
            >
              {isValidating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>
            Validated {validationResult.contractsValidated} of {validationResult.totalContracts} contracts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {validationResult.summary.realContracts}
              </div>
              <div className="text-sm text-muted-foreground">Real Contracts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {validationResult.summary.placeholderContracts}
              </div>
              <div className="text-sm text-muted-foreground">Placeholders</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {validationResult.summary.failedValidations}
              </div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatSize(validationResult.summary.totalSizeBytes)}
              </div>
              <div className="text-sm text-muted-foreground">Total Size</div>
            </div>
          </div>

          <Progress 
            value={(validationResult.summary.realContracts / validationResult.totalContracts) * 100} 
            className="mb-4"
          />
        </CardContent>
      </Card>

      {/* Production Readiness Alert */}
      {productionReadiness && !productionReadiness.ready && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Not Ready for Production:</strong>
            <ul className="mt-2 list-disc list-inside">
              {productionReadiness.issues.map((issue: string, index: number) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Individual Contract Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {validationResult.results.map((result) => (
          <Card key={result.contractName}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center gap-2">
                  {getContractIcon(result.contractName)}
                  {result.contractName.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                <Badge variant={getStatusColor(result)}>
                  {getStatusText(result)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Size:</span>
                <span className="font-mono">{formatSize(result.size)}</span>
              </div>
              
              {result.sourceHash && (
                <div className="flex justify-between text-sm">
                  <span>Source Hash:</span>
                  <span className="font-mono text-xs">{result.sourceHash.slice(0, 8)}...</span>
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-red-600">Errors:</div>
                  <ul className="text-xs text-red-600 space-y-1">
                    {result.errors.map((error, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.warnings.length > 0 && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-yellow-600">Warnings:</div>
                  <ul className="text-xs text-yellow-600 space-y-1">
                    {result.warnings.map((warning, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.isValid && result.hasRealBytecode && (
                <div className="flex items-center gap-1 text-green-600 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Ready for deployment
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recommendations */}
      {validationResult.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {validationResult.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2">
                  {recommendation.startsWith('✅') ? (
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  )}
                  <span className="text-sm">{recommendation.replace('✅ ', '')}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};