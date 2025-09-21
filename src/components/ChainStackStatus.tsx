import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useChainStackCache } from '@/hooks/useChainStackCache';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { ChainStackTonService } from '@/services/chainstackTonService';
import { useWeb3 } from '@/hooks/useWeb3';
import { Activity, Zap, DollarSign, Clock, TrendingUp, BarChart3, RefreshCw } from 'lucide-react';

export const ChainStackStatus: React.FC = () => {
  const [marketData, setMarketData] = useState<any>(null);
  const [healthCheck, setHealthCheck] = useState<any>(null);
  const [transactionHistory, setTransactionHistory] = useState<any>(null);
  const [feeEstimate, setFeeEstimate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { walletAddress, isConnected } = useWeb3();
  
  // Use optimized caching and monitoring
  const {
    getWalletBalance,
    getTransactionHistory,
    estimateFee,
    getMarketData,
    healthCheck: cachedHealthCheck,
    stats: cacheStats
  } = useChainStackCache();
  
  const { 
    metrics, 
    recordAPICall, 
    getRateLimitStatus 
  } = usePerformanceMonitor();

  useEffect(() => {
    const loadChainStackData = async () => {
      setLoading(true);
      const startTime = Date.now();
      
      try {
        // Load essential data first with caching
        const marketDataPromise = getMarketData().then(data => {
          recordAPICall('market-data', Date.now() - startTime, true, true);
          return data;
        });
        
        const healthCheckPromise = cachedHealthCheck().then(data => {
          recordAPICall('health-check', Date.now() - startTime, true, true);
          return data;
        });

        const [market, health] = await Promise.all([marketDataPromise, healthCheckPromise]);
        
        setMarketData(market);
        setHealthCheck(health);

        // Load wallet-specific data only if connected (lazy loading)
        if (isConnected && walletAddress) {
          // Use setTimeout to avoid blocking UI
          setTimeout(async () => {
            try {
              const txStart = Date.now();
              const [txHistory, feeEst] = await Promise.all([
                getTransactionHistory(walletAddress, 5).then(data => {
                  recordAPICall('transaction-history', Date.now() - Date.now(), true, true);
                  return data;
                }),
                estimateFee(
                  walletAddress,
                  'EQCKt2WPGX-fh0cIAz38Ljd_OKQjoZE_cqk7QrYGsNuG5wq7',
                  BigInt('1000000000'),
                  'transfer'
                ).then(data => {
                  recordAPICall('fee-estimate', Date.now() - Date.now(), true, true);
                  return data;
                })
              ]);
              
              setTransactionHistory(txHistory);
              setFeeEstimate(feeEst);
            } catch (error) {
              recordAPICall('wallet-data', Date.now() - Date.now(), false, false);
              console.warn('Failed to load wallet-specific data:', error);
            }
          }, 100);
        }
      } catch (error) {
        recordAPICall('chainstack-data', Date.now() - startTime, false, false);
        console.error('Failed to load ChainStack data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChainStackData();
  }, [isConnected, walletAddress, getMarketData, cachedHealthCheck, getTransactionHistory, estimateFee, recordAPICall]);

  const refreshData = async () => {
    setLoading(true);
    // Clear cache and reload data
    const startTime = Date.now();
    try {
      const [market, health] = await Promise.all([
        getMarketData(),
        cachedHealthCheck()
      ]);
      
      setMarketData(market);
      setHealthCheck(health);
      recordAPICall('refresh', Date.now() - startTime, false, true);
    } catch (error) {
      recordAPICall('refresh', Date.now() - startTime, false, false);
      console.error('Failed to refresh data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 animate-pulse" />
            ChainStack TON Infrastructure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            ChainStack Infrastructure Status
            <Badge variant={healthCheck?.healthy ? "default" : "destructive"}>
              {healthCheck?.healthy ? "Healthy" : "Issues Detected"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-500" />
              <span className="text-sm">
                Latency: {healthCheck?.latency || 0}ms
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm">
                Block Time: {marketData?.blockchain?.avgBlockTime || 5}s
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <span className="text-sm">
                TPS: {marketData?.blockchain?.tps || 0}
              </span>
            </div>
          </div>
          
          {healthCheck?.error && (
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
              {healthCheck.error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Market Data */}
      {marketData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Network & Market Data
              {marketData.chainstackPowered && (
                <Badge variant="outline">Powered by ChainStack</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Network</div>
                <div className="font-medium">{marketData.network?.name}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Block Height</div>
                <div className="font-medium">{marketData.network?.blockHeight?.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">TON Price</div>
                <div className="font-medium">
                  {marketData.market?.price ? `$${marketData.market.price.toFixed(2)}` : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Validators</div>
                <div className="font-medium">{marketData.network?.validators || 'N/A'}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fee Estimation */}
      {feeEstimate && (
        <Card>
          <CardHeader>
            <CardTitle>Real-Time Fee Estimation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Estimated Fee</div>
                <div className="font-medium">{feeEstimate.formattedFee} TON</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Recommended Fee</div>
                <div className="font-medium text-green-600">{feeEstimate.formattedRecommended} TON</div>
              </div>
            </div>
            
            {feeEstimate.fallback && (
              <Badge variant="outline">Using Fallback Estimation</Badge>
            )}
            {feeEstimate.chainstackPowered && (
              <Badge variant="default">ChainStack Powered</Badge>
            )}
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      {transactionHistory && transactionHistory.transactions?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions (ChainStack)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactionHistory.transactions.slice(0, 3).map((tx: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {tx.hash?.slice(0, 8)}...{tx.hash?.slice(-6)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {tx.timestamp ? new Date(tx.timestamp).toLocaleString() : 'Unknown time'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {ChainStackTonService.formatNanotons(tx.value || '0')} TON
                    </div>
                    <Badge variant={tx.success ? "default" : "destructive"} className="text-xs">
                      {tx.success ? "Success" : "Failed"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance & Rate Limiting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Requests/sec</div>
                <div className="font-medium text-lg">
                  {metrics.requestsPerSecond.toFixed(1)}
                  <span className="text-sm ml-1 text-muted-foreground">/ 25 limit</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Cache Hit Rate</div>
                <div className="font-medium text-lg text-green-600">
                  {metrics.apiCalls > 0 ? ((metrics.cacheHits / metrics.apiCalls) * 100).toFixed(1) : 0}%
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Avg Response Time</div>
                <div className="font-medium text-lg">
                  {metrics.averageResponseTime.toFixed(0)}ms
                </div>
              </div>
            </div>
            
            {/* Rate Limit Warning */}
            {(() => {
              const rateLimitStatus = getRateLimitStatus(25);
              return !rateLimitStatus.withinLimit && (
                <div className="bg-destructive/10 border border-destructive/20 rounded p-3">
                  <div className="text-sm text-destructive font-medium">Rate Limit Warning</div>
                  <div className="text-xs text-destructive mt-1">{rateLimitStatus.recommendation}</div>
                </div>
              );
            })()}
            
            {/* Cache Stats */}
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Cache Entries: {cacheStats.cacheSize}</div>
              <div>Active Requests: {cacheStats.activeRequests}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button onClick={refreshData} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </Button>
        {!isConnected && (
          <Badge variant="outline">
            Connect wallet for more features
          </Badge>
        )}
      </div>
    </div>
  );
};