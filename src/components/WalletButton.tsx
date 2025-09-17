import React, { useState } from 'react';
import { Wallet, User, LogOut, Loader2, Copy, ExternalLink, Crown, Zap, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Web3ProfileModal } from '@/components/Web3ProfileModal';
import { UnifiedWalletDisplay } from '@/components/UnifiedWalletDisplay';
import { useWeb3 } from '@/hooks/useWeb3';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export const WalletButton: React.FC = () => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const {
    isConnected,
    profile,
    shortAddress,
    formattedBalance,
    tonDnsName,
    isLoading,
    connectWallet,
    disconnectWallet,
    walletInfo,
  } = useWeb3();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCopyAddress = () => {
    if (profile?.wallet_address) {
      navigator.clipboard.writeText(profile.wallet_address);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      });
    }
  };

  const handleViewOnExplorer = () => {
    if (profile?.wallet_address) {
      window.open(`https://tonviewer.com/${profile.wallet_address}`, '_blank');
    }
  };

  const handleDisconnectWallet = async () => {
    setDropdownOpen(false); // Close dropdown first
    await disconnectWallet();
  };

  if (!isConnected) {
    return (
      <Button
        onClick={connectWallet}
        disabled={isLoading}
        variant="aurora"
        className="min-w-[160px] relative overflow-hidden group"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Connecting...
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-20 transition-opacity" />
            <Wallet className="h-4 w-4 mr-2" />
            Connect TON Wallet
          </>
        )}
      </Button>
    );
  }

  const handleOpenProfileModal = () => {
    setDropdownOpen(false); // Close dropdown first
    setTimeout(() => setShowProfileModal(true), 50); // Small delay to ensure dropdown closes
  };

  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
  };

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="glass" className="min-w-[180px] justify-start p-3 h-auto">
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-gradient-to-br from-aurora/20 to-primary/20">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start ml-3 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate max-w-[100px]">
                  {tonDnsName || profile?.display_name || 'Anonymous'}
                </span>
                {profile?.reputation_score > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    <Crown className="h-3 w-3 mr-1" />
                    {profile.reputation_score}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{shortAddress}</span>
                <span>•</span>
                <span className="text-green-400 font-medium">{formattedBalance}</span>
              </div>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72 glass-panel no-hover-lift">
          <DropdownMenuLabel className="pb-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-aurora/20 to-primary/20">
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {tonDnsName || profile?.display_name || 'Anonymous User'}
                </p>
                <p className="text-xs text-muted-foreground">{shortAddress}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    {formattedBalance}
                  </Badge>
                  {profile?.reputation_score > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      Rep: {profile.reputation_score}
                    </Badge>
                  )}
                </div>
                {walletInfo && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Connected via {walletInfo.name}
                  </p>
                )}
              </div>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleOpenProfileModal}>
            <User className="h-4 w-4 mr-3" />
            <span>Manage Profile</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => navigate('/dashboard')}>
            <Settings className="h-4 w-4 mr-3" />
            <span>Dashboard</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleCopyAddress}>
            <Copy className="h-4 w-4 mr-3" />
            <span>Copy Address</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleViewOnExplorer}>
            <ExternalLink className="h-4 w-4 mr-3" />
            <span>View on Explorer</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleDisconnectWallet} className="text-destructive">
            <LogOut className="h-4 w-4 mr-3" />
            <span>Disconnect Wallet</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Web3ProfileModal 
        open={showProfileModal}
        onClose={handleCloseProfileModal}
      />
    </>
  );
};