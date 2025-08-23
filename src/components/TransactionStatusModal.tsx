import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Copy,
  RefreshCw,
  Zap,
  DollarSign
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { batchUpdates } from '@/utils/performance';

interface TransactionStatusModalProps {
  open: boolean;
  onClose: () => void;
  transaction?: {
    hash?: string;
    status: 'pending' | 'success' | 'failed' | 'cancelled';
    amount?: string;
    type: string;
    timestamp: Date;
    details?: Record<string, any>;
  };
}

export const TransactionStatusModal: React.FC<TransactionStatusModalProps> = ({
  open,
  onClose,
  transaction
}) => {
  const [timeElapsed, setTimeElapsed] = useState<string>('0s');
  const { toast } = useToast();

  useEffect(() => {
    if (!transaction || !open) return;

    const updateTimeElapsed = () => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - transaction.timestamp.getTime()) / 1000);
      
      let timeString = '';
      if (diff < 60) {
        timeString = `${diff}s`;
      } else if (diff < 3600) {
        timeString = `${Math.floor(diff / 60)}m`;
      } else {
        timeString = `${Math.floor(diff / 3600)}h`;
      }
      
      batchUpdates(() => setTimeElapsed(timeString));
    };

    updateTimeElapsed();
    const interval = setInterval(updateTimeElapsed, 1000);

    return () => clearInterval(interval);
  }, [transaction, open]);

  if (!transaction) return null;

  const getStatusConfig = () => {
    switch (transaction.status) {
      case 'pending':
        return {
          icon: Clock,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/20',
          title: 'Transaction Pending',
          description: 'Your transaction is being processed on the TON network.',
          badgeVariant: 'secondary' as const,
          showRefresh: true
        };
      case 'success':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-500/20',
          title: 'Transaction Successful',
          description: 'Your transaction has been confirmed on the blockchain.',
          badgeVariant: 'default' as const,
          showRefresh: false
        };
      case 'failed':
        return {
          icon: AlertCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-500/20',
          title: 'Transaction Failed',
          description: 'Your transaction could not be completed. Please try again.',
          badgeVariant: 'destructive' as const,
          showRefresh: true
        };
      case 'cancelled':
        return {
          icon: AlertCircle,
          color: 'text-gray-500',
          bgColor: 'bg-gray-500/20',
          title: 'Transaction Cancelled',
          description: 'The transaction was cancelled by the user.',
          badgeVariant: 'secondary' as const,
          showRefresh: false
        };
    }
  };

  const statusConfig = getStatusConfig();

  const handleCopyHash = () => {
    if (transaction.hash) {
      navigator.clipboard.writeText(transaction.hash);
      toast({
        title: "Hash Copied",
        description: "Transaction hash copied to clipboard",
      });
    }
  };

  const handleViewOnExplorer = () => {
    if (transaction.hash) {
      window.open(`https://tonviewer.com/transaction/${transaction.hash}`, '_blank');
    }
  };

  const formatTransactionType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md glass-panel border-glass">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${statusConfig.bgColor}`}>
              <statusConfig.icon className={`h-5 w-5 ${statusConfig.color}`} />
            </div>
            {statusConfig.title}
          </DialogTitle>
          <DialogDescription>
            {statusConfig.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Transaction Details */}
          <Card className="glass-panel border-glass">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={statusConfig.badgeVariant} className="capitalize">
                  {transaction.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Type</span>
                <span className="text-sm font-medium">
                  {formatTransactionType(transaction.type)}
                </span>
              </div>

              {transaction.amount && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-green-500" />
                    <span className="text-sm font-medium text-green-500">
                      {transaction.amount} TON
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Time</span>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span className="text-sm">{timeElapsed} ago</span>
                </div>
              </div>

              {transaction.hash && (
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">Transaction Hash</span>
                  <div className="flex items-center gap-2 p-2 rounded bg-muted/20">
                    <code className="text-xs flex-1 truncate">
                      {transaction.hash}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={handleCopyHash}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Network Info */}
          {transaction.status === 'pending' && (
            <Card className="glass-panel border-blue-500/20 bg-blue-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium text-blue-500">TON Network</span>
                  </div>
                  <div className="flex-1 text-right">
                    <span className="text-xs text-muted-foreground">
                      Typical confirmation time: 5-30 seconds
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {transaction.hash && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewOnExplorer}
                  className="flex-1"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Explorer
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyHash}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </>
            )}
            
            {statusConfig.showRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Refresh transaction status - would call API in real implementation
                  toast({
                    title: "Refreshing",
                    description: "Checking transaction status...",
                  });
                }}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>

          <Button onClick={onClose} className="w-full" variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionStatusModal;