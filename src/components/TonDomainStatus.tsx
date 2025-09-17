import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Globe, Shield } from 'lucide-react';
import { useTonSites } from '@/hooks/useTonSites';
import { useWeb3 } from '@/hooks/useWeb3';
import { toast } from 'sonner';

interface TonDomainStatusProps {
  className?: string;
}

export const TonDomainStatus: React.FC<TonDomainStatusProps> = ({ className }) => {
  const { isTonDomain, currentDomain, isProxyMode, getAppTonDomain } = useTonSites();
  const { tonDnsName, isConnected } = useWeb3();

  const handleVisitTonSite = () => {
    const tonDomain = getAppTonDomain();
    toast.success(`Redirecting to ${tonDomain}...`);
    // In production, this would navigate through TON proxy
    window.open(`https://ton.org/proxy?url=${encodeURIComponent(tonDomain)}`, '_blank');
  };

  return (
    <div className={`flex flex-col gap-3 p-4 glass-panel rounded-xl border border-white/10 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Domain Status</span>
        </div>
        
        {isTonDomain ? (
          <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
            <Shield className="h-3 w-3 mr-1" />
            TON Site
          </Badge>
        ) : (
          <Badge variant="outline" className="border-muted-foreground/30">
            Web Version
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Current:</span>
          <span className="font-mono text-xs bg-background/50 px-2 py-1 rounded">
            {currentDomain}
          </span>
        </div>

        {tonDnsName && isConnected && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Your TON DNS:</span>
            <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-1 rounded">
              {tonDnsName}
            </span>
          </div>
        )}

        {isProxyMode && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Secured by TON Blockchain
          </div>
        )}
      </div>

      {!isTonDomain && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleVisitTonSite}
          className="w-full bg-primary/5 border-primary/20 hover:bg-primary/10 text-primary"
        >
          <ExternalLink className="h-3 w-3 mr-2" />
          Visit TON Site
        </Button>
      )}
    </div>
  );
};

export default TonDomainStatus;