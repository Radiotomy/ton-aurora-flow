import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  RefreshCw, 
  Zap,
  ArrowUpDown
} from 'lucide-react';
import { UnifiedPaymentService } from '@/services/unifiedPaymentService';
import { useToast } from '@/hooks/use-toast';

interface ExchangeRate {
  pair: string;
  rate: number;
  change24h: number;
  volume24h: number;
  lastUpdated: Date;
}

interface RealTimeRateWidgetProps {
  onQuickConvert?: (fromToken: 'TON' | 'AUDIO', toToken: 'TON' | 'AUDIO') => void;
  compact?: boolean;
}

export const RealTimeRateWidget = ({ 
  onQuickConvert,
  compact = false 
}: RealTimeRateWidgetProps) => {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const { toast } = useToast();

  const fetchRates = async () => {
    setLoading(true);
    try {
      // Fetch current rates
      const tonToAudio = await UnifiedPaymentService.getConversionRate('TON', 'AUDIO');
      const audioToTon = await UnifiedPaymentService.getConversionRate('AUDIO', 'TON');
      
      // Simulate additional market data (in production, this would come from real APIs)
      const mockRates: ExchangeRate[] = [
        {
          pair: 'TON/AUDIO',
          rate: tonToAudio,
          change24h: Math.random() * 10 - 5, // -5% to +5%
          volume24h: Math.random() * 1000000 + 100000, // 100k to 1.1M
          lastUpdated: new Date()
        },
        {
          pair: 'AUDIO/TON',
          rate: audioToTon,
          change24h: Math.random() * 10 - 5,
          volume24h: Math.random() * 1000000 + 100000,
          lastUpdated: new Date()
        }
      ];
      
      setRates(mockRates);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching rates:', error);
      toast({
        title: "Rate Update Failed",
        description: "Failed to fetch latest exchange rates",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh rates every 30 seconds
  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatRate = (rate: number) => {
    if (rate > 1000) return rate.toLocaleString();
    if (rate > 100) return rate.toFixed(2);
    if (rate > 1) return rate.toFixed(4);
    return rate.toFixed(6);
  };

  const formatVolume = (volume: number) => {
    if (volume > 1000000) return `${(volume / 1000000).toFixed(1)}M`;
    if (volume > 1000) return `${(volume / 1000).toFixed(1)}K`;
    return volume.toFixed(0);
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-3 w-3 text-red-500" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

  if (compact) {
    return (
      <Card className="border-muted">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Live Rates</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchRates}
              disabled={loading}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          <div className="mt-3 space-y-2">
            {rates.slice(0, 1).map((rate, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{rate.pair}</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-mono">{formatRate(rate.rate)}</span>
                  {getChangeIcon(rate.change24h)}
                  <span className={`text-xs ${getChangeColor(rate.change24h)}`}>
                    {rate.change24h >= 0 ? '+' : ''}{rate.change24h.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span>Live Exchange Rates</span>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdate && (
              <span className="text-xs text-muted-foreground">
                Updated {lastUpdate.toLocaleTimeString()}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchRates}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {rates.map((rate, index) => (
          <div key={index}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="font-mono text-lg">
                    {rate.pair.includes('TON') ? '💎' : '♫'}
                  </span>
                  <span className="font-semibold">{rate.pair}</span>
                </div>
                {onQuickConvert && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const [from, to] = rate.pair.split('/') as ['TON' | 'AUDIO', 'TON' | 'AUDIO'];
                      onQuickConvert(from, to);
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div className="text-right">
                <div className="font-mono text-lg font-semibold">
                  {formatRate(rate.rate)}
                </div>
                <div className="flex items-center gap-1">
                  {getChangeIcon(rate.change24h)}
                  <span className={`text-sm ${getChangeColor(rate.change24h)}`}>
                    {rate.change24h >= 0 ? '+' : ''}{rate.change24h.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>24h Volume: {formatVolume(rate.volume24h)}</span>
              <span>Last: {rate.lastUpdated.toLocaleTimeString()}</span>
            </div>

            {index < rates.length - 1 && <Separator className="mt-4" />}
          </div>
        ))}

        <div className="pt-2 border-t">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live rates • Auto-refresh 30s</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};