import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAudiusAuth } from '@/hooks/useAudiusAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { AudiusRoleService } from '@/services/audiusRoleService';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from '@/hooks/use-toast';
import { Music, CheckCircle, Loader2, Star, Users } from 'lucide-react';

interface ArtistUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ArtistUpgradeModal: React.FC<ArtistUpgradeModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { user } = useAuth();
  const { user: audiusUser, isAuthenticated: isAudiusAuthenticated, login: audiusLogin } = useAudiusAuth();
  const { hasAnyArtistRole, assignRole, refetch } = useUserRoles(user?.id);
  
  const [loading, setLoading] = useState(false);
  const [eligibilityCheck, setEligibilityCheck] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [applicationStatus, setApplicationStatus] = useState<any>(null);

  useEffect(() => {
    if (open && user) {
      fetchProfile();
      if (isAudiusAuthenticated) {
        checkEligibility();
        checkApplicationStatus();
      }
    }
  }, [open, user, isAudiusAuthenticated]);

  const fetchProfile = async () => {
    if (!user?.id) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();
    
    setProfile(data);
  };

  const checkEligibility = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const eligibility = await AudiusRoleService.checkArtistEligibility(user.id);
      setEligibilityCheck(eligibility);
    } catch (error) {
      console.error('Error checking eligibility:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkApplicationStatus = async () => {
    if (!profile?.id) return;
    
    const status = await AudiusRoleService.getApplicationStatus(profile.id);
    setApplicationStatus(status);
  };

  const handleAudiusUpgrade = async () => {
    if (!user?.id || !profile?.id) return;
    
    setLoading(true);
    try {
      // Call the Audius role sync edge function
      const { error } = await supabase.functions.invoke('audius-role-sync', {
        body: { 
          audiusUserData: eligibilityCheck?.audiusData 
        },
      });

      if (error) throw error;
      
      // Refresh roles
      await refetch();
      
      toast({
        title: "Success!",
        description: "Your Audius artist roles have been synchronized.",
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error upgrading via Audius:', error);
      toast({
        title: "Error",
        description: "Failed to sync Audius artist status.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlatformApplication = async () => {
    if (!profile?.id) return;
    
    setLoading(true);
    try {
      await AudiusRoleService.createArtistApplication(
        profile.id,
        'platform_artist',
        eligibilityCheck?.audiusData
      );
      
      toast({
        title: "Application Submitted",
        description: "Your platform artist application has been submitted for review.",
      });
      
      checkApplicationStatus();
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Error",
        description: "Failed to submit artist application.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (hasAnyArtistRole()) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="glass-panel">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Artist Status Active
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <p className="text-muted-foreground">
              You already have artist access! Enjoy creating and sharing your music.
            </p>
            <Button 
              className="mt-4" 
              onClick={() => onOpenChange(false)}
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Become an Artist
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Audius Integration Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="w-5 h-5" />
                Audius Artist Verification
                <Badge variant="secondary">Recommended</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isAudiusAuthenticated ? (
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect your Audius account for instant artist verification if you have uploaded tracks.
                  </p>
                  <Button onClick={audiusLogin} disabled={loading}>
                    Connect Audius Account
                  </Button>
                </div>
              ) : eligibilityCheck?.eligible ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium">Eligible for Artist Status</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {eligibilityCheck.reason}
                  </p>
                  {audiusUser && (
                    <div className="flex items-center gap-4 mb-4 p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Music className="w-4 h-4" />
                        <span className="text-sm">{audiusUser.track_count} tracks</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">{audiusUser.follower_count} followers</span>
                      </div>
                      {audiusUser.is_verified && (
                        <Badge variant="secondary">
                          <Star className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                  )}
                  <Button onClick={handleAudiusUpgrade} disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Activate Artist Status
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {eligibilityCheck?.reason || 'Checking Audius profile...'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Upload tracks to Audius first, then return here for instant artist verification.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Platform Artist Card */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Artist Application</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {applicationStatus?.status === 'pending' ? (
                <div>
                  <Badge variant="outline">Application Pending</Badge>
                  <p className="text-sm text-muted-foreground mt-2">
                    Your application is being reviewed. You'll be notified once it's processed.
                  </p>
                </div>
              ) : applicationStatus?.status === 'approved' ? (
                <div>
                  <Badge variant="secondary">Application Approved</Badge>
                  <p className="text-sm text-muted-foreground mt-2">
                    Your artist application has been approved! Your roles should be active.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Apply for platform artist status to upload original content and access creator features.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={handlePlatformApplication}
                    disabled={loading}
                  >
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Apply for Platform Artist
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};