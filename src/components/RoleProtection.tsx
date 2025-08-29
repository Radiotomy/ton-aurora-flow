import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles, AppRole } from '@/hooks/useUserRoles';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Shield, Music, Crown } from 'lucide-react';
import { ArtistUpgradeModal } from './ArtistUpgradeModal';

interface RoleProtectionProps {
  children: React.ReactNode;
  requiredRole?: AppRole;
  requireAnyArtistRole?: boolean;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

export const RoleProtection: React.FC<RoleProtectionProps> = ({
  children,
  requiredRole,
  requireAnyArtistRole = false,
  fallback,
  showUpgradePrompt = true,
}) => {
  const { user } = useAuth();
  const { hasRole, hasAnyArtistRole, canAccessCreatorStudio, loading } = useUserRoles(user?.id);
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check specific role requirement
  if (requiredRole && !hasRole(requiredRole)) {
    if (fallback) return <>{fallback}</>;
    
    return (
      <Card className="p-8 text-center glass-panel">
        <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold mb-2">Access Restricted</h3>
        <p className="text-muted-foreground mb-6">
          You need {requiredRole.replace('_', ' ')} role to access this feature.
        </p>
        {showUpgradePrompt && (
          <Button onClick={() => setShowUpgradeModal(true)}>
            <Crown className="w-4 h-4 mr-2" />
            Upgrade Account
          </Button>
        )}
        <ArtistUpgradeModal 
          open={showUpgradeModal} 
          onOpenChange={setShowUpgradeModal} 
        />
      </Card>
    );
  }

  // Check any artist role requirement
  if (requireAnyArtistRole && !hasAnyArtistRole()) {
    if (fallback) return <>{fallback}</>;
    
    return (
      <Card className="p-8 text-center glass-panel">
        <Music className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold mb-2">Artist Access Required</h3>
        <p className="text-muted-foreground mb-6">
          This feature is only available to verified artists and creators.
        </p>
        {showUpgradePrompt && (
          <Button onClick={() => setShowUpgradeModal(true)}>
            <Crown className="w-4 h-4 mr-2" />
            Become an Artist
          </Button>
        )}
        <ArtistUpgradeModal 
          open={showUpgradeModal} 
          onOpenChange={setShowUpgradeModal} 
        />
      </Card>
    );
  }

  // User has required permissions
  return <>{children}</>;
};