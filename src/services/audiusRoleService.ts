import { supabase } from '@/integrations/supabase/client';
import { AudiusAuthService } from './audiusAuthService';
import { AppRole } from '@/hooks/useUserRoles';

export class AudiusRoleService {
  /**
   * Synchronize user roles based on their Audius profile data
   */
  static async syncAudiusRoles(userId: string): Promise<void> {
    try {
      // Get current user's Audius profile
      const currentUser = await AudiusAuthService.getCurrentUser();
      if (!currentUser) return;

      const rolesToAssign: { role: AppRole; metadata: any }[] = [];

      // Check if user has tracks (is an artist)
      if (currentUser.track_count > 0) {
        rolesToAssign.push({
          role: 'audius_artist',
          metadata: {
            audius_user_id: currentUser.id,
            audius_handle: currentUser.handle,
            track_count: currentUser.track_count,
            synced_at: new Date().toISOString()
          }
        });

        // Check if verified on Audius
        if (currentUser.verified) {
          rolesToAssign.push({
            role: 'verified_audius_artist',
            metadata: {
              audius_user_id: currentUser.id,
              audius_handle: currentUser.handle,
              verified_on_audius: true,
              verification_synced_at: new Date().toISOString()
            }
          });
        }
      }

      // Assign roles in database
      for (const { role, metadata } of rolesToAssign) {
        await supabase
          .from('user_roles')
          .upsert({
            user_id: userId,
            role,
            metadata
          }, {
            onConflict: 'user_id,role'
          });
      }

      console.log(`Synced ${rolesToAssign.length} Audius roles for user ${userId}`);
    } catch (error) {
      console.error('Error syncing Audius roles:', error);
    }
  }

  /**
   * Check if user is eligible for automatic artist role upgrade
   */
  static async checkArtistEligibility(userId: string): Promise<{
    eligible: boolean;
    reason: string;
    suggestedRole?: AppRole;
    audiusData?: any;
  }> {
    try {
      const currentUser = await AudiusAuthService.getCurrentUser();
      if (!currentUser) {
        return {
          eligible: false,
          reason: 'No Audius account connected'
        };
      }

      // Check for basic artist eligibility
      if (currentUser.track_count > 0) {
        return {
          eligible: true,
          reason: `Has ${currentUser.track_count} tracks on Audius`,
          suggestedRole: currentUser.verified ? 'verified_audius_artist' : 'audius_artist',
          audiusData: currentUser
        };
      }

      // Check for potential based on followers
      if (currentUser.follower_count >= 100) {
        return {
          eligible: true,
          reason: `Has ${currentUser.follower_count} followers, likely to upload tracks`,
          suggestedRole: 'audius_artist',
          audiusData: currentUser
        };
      }

      return {
        eligible: false,
        reason: 'No tracks uploaded and insufficient follower count',
        audiusData: currentUser
      };
    } catch (error) {
      console.error('Error checking artist eligibility:', error);
      return {
        eligible: false,
        reason: 'Error checking Audius profile'
      };
    }
  }

  /**
   * Create an artist application for manual review
   */
  static async createArtistApplication(
    profileId: string,
    applicationType: 'audius_upgrade' | 'platform_artist',
    audiusData?: any,
    portfolioData?: any
  ): Promise<void> {
    const { error } = await supabase
      .from('artist_applications')
      .insert({
        profile_id: profileId,
        application_type: applicationType,
        audius_user_id: audiusData?.id,
        audius_handle: audiusData?.handle,
        audius_verification_data: audiusData,
        platform_portfolio: portfolioData,
      });

    if (error) {
      throw new Error(`Failed to create artist application: ${error.message}`);
    }
  }

  /**
   * Get user's artist application status
   */
  static async getApplicationStatus(profileId: string) {
    const { data, error } = await supabase
      .from('artist_applications')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching application status:', error);
      return null;
    }

    return data;
  }
}