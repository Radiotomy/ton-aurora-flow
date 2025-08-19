import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { tonPaymentService } from '@/services/tonPaymentService';
import { useAuth } from '@/hooks/useAuth';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Heart, 
  ShoppingBag, 
  Users, 
  Gift,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';

interface Transaction {
  id: string;
  transaction_hash: string;
  transaction_type: string;
  amount_ton: number;
  fee_ton: number;
  status: string;
  created_at: string;
  metadata?: any;
  from_profile?: {
    display_name: string;
    avatar_url?: string;
  };
  to_profile?: {
    display_name: string;
    avatar_url?: string;
  };
}

const getTransactionIcon = (type: string, isOutgoing: boolean) => {
  const IconComponent = isOutgoing ? ArrowUpRight : ArrowDownLeft;
  const colorClass = isOutgoing ? 'text-destructive' : 'text-primary';
  
  switch (type) {
    case 'tip':
      return <Heart className={`h-4 w-4 ${colorClass}`} />;
    case 'nft_purchase':
      return <ShoppingBag className={`h-4 w-4 ${colorClass}`} />;
    case 'fan_club_membership':
      return <Users className={`h-4 w-4 ${colorClass}`} />;
    case 'reward':
      return <Gift className={`h-4 w-4 ${colorClass}`} />;
    default:
      return <IconComponent className={`h-4 w-4 ${colorClass}`} />;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'confirmed':
      return <CheckCircle className="h-4 w-4 text-primary" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-destructive" />;
    case 'pending':
    default:
      return <Clock className="h-4 w-4 text-secondary" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'default';
    case 'failed':
      return 'destructive';
    case 'pending':
    default:
      return 'secondary';
  }
};

const formatTransactionType = (type: string) => {
  switch (type) {
    case 'tip':
      return 'Tip';
    case 'nft_purchase':
      return 'NFT Purchase';
    case 'fan_club_membership':
      return 'Fan Club';
    case 'reward':
      return 'Reward';
    default:
      return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
};

const TransactionHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      loadTransactions();
    }
  }, [isAuthenticated]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const history = await tonPaymentService.getTransactionHistory(50);
      setTransactions(history);
    } catch (err) {
      console.error('Failed to load transactions:', err);
      setError('Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };

  const openTonScan = (hash: string) => {
    // Open transaction in TON Explorer
    const url = `https://testnet.tonscan.org/tx/${hash}`;
    window.open(url, '_blank');
  };

  if (!isAuthenticated) {
    return (
      <Card className="glass-panel">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Please sign in to view your transaction history.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading transactions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={loadTransactions} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-panel">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Transaction History</CardTitle>
        <Button onClick={loadTransactions} variant="ghost" size="sm">
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {transactions.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-muted-foreground">No transactions yet.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Start tipping artists or purchasing NFTs to see your activity here.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-0">
              {transactions.map((transaction, index) => {
                const isOutgoing = transaction.from_profile !== null;
                const otherProfile = isOutgoing ? transaction.to_profile : transaction.from_profile;
                
                return (
                  <div key={transaction.id}>
                    <div className="p-4 hover:bg-muted/5 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getTransactionIcon(transaction.transaction_type, isOutgoing)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">
                                {formatTransactionType(transaction.transaction_type)}
                              </p>
                              <Badge variant={getStatusColor(transaction.status)} className="text-xs">
                                {getStatusIcon(transaction.status)}
                                <span className="ml-1">{transaction.status}</span>
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {otherProfile && (
                                <span className="text-sm text-muted-foreground">
                                  {isOutgoing ? 'to' : 'from'} {otherProfile.display_name}
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {new Date(transaction.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            {transaction.metadata?.message && (
                              <p className="text-xs text-muted-foreground italic mt-1">
                                "{transaction.metadata.message}"
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${
                            isOutgoing ? 'text-destructive' : 'text-primary'
                          }`}>
                            {isOutgoing ? '-' : '+'}{transaction.amount_ton} TON
                          </p>
                          {transaction.fee_ton > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Fee: {transaction.fee_ton} TON
                            </p>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openTonScan(transaction.transaction_hash)}
                            className="h-6 px-2 mt-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    {index < transactions.length - 1 && <Separator />}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;