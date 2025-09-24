/**
 * Contract Validation Page
 * Comprehensive contract compilation testing and validation interface
 */

import React from 'react';
import { ContractValidationPanel } from '@/components/ContractValidationPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  FileCode2, 
  Zap, 
  Shield, 
  Cpu,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ContractValidation = () => {
  const navigate = useNavigate();

  const validationSteps = [
    {
      icon: <FileCode2 className="w-5 h-5" />,
      title: "Bytecode Structure",
      description: "Validates compiled contract bytecode structure and format"
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Compilation Pipeline",
      description: "Tests FunC source compilation and compares with stored bytecode"
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Production Readiness",
      description: "Checks for placeholder contracts and missing configurations"
    },
    {
      icon: <Cpu className="w-5 h-5" />,
      title: "Mainnet Compatibility",
      description: "Validates contracts for mainnet deployment requirements"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl pt-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/deploy')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Deploy
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Contract Validation</h1>
            <p className="text-muted-foreground">
              Comprehensive testing and validation of AudioTon smart contracts
            </p>
          </div>
        </div>
        <Badge variant="outline" className="gap-2">
          <Shield className="w-4 h-4" />
          Phase 1: Real Contract Development
        </Badge>
      </div>

      {/* Validation Process Overview */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Validation Process</CardTitle>
          <CardDescription>
            Our comprehensive validation ensures all contracts are production-ready
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {validationSteps.map((step, index) => (
              <div key={index} className="flex flex-col items-center text-center p-4 rounded-lg border">
                <div className="mb-3 p-2 rounded-full bg-primary/10 text-primary">
                  {step.icon}
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Validation Panel */}
      <ContractValidationPanel />

      {/* Documentation Links */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="w-5 h-5" />
            Related Documentation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={() => navigate('/help')}
            >
              <div className="text-left">
                <div className="font-semibold">Smart Contract Guide</div>
                <div className="text-sm text-muted-foreground">
                  Learn about AudioTon's contract architecture
                </div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={() => navigate('/deploy')}
            >
              <div className="text-left">
                <div className="font-semibold">Deployment Manager</div>
                <div className="text-sm text-muted-foreground">
                  Deploy validated contracts to mainnet
                </div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={() => window.open('https://docs.ton.org/develop/smart-contracts', '_blank')}
            >
              <div className="text-left">
                <div className="font-semibold">TON Documentation</div>
                <div className="text-sm text-muted-foreground">
                  Official TON smart contract docs
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};