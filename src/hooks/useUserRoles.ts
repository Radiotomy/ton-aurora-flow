import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type AppRole = 
  | 'fan' 
  | 'audius_artist' 
  | 'verified_audius_artist' 
  | 'platform_artist' 
  | 'verified_platform_artist' 
  | 'admin';

export const useUserRoles = (userId?: string) => {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [highestRole, setHighestRole] = useState<AppRole>('fan');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      // Get all roles for the user
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (rolesError) throw rolesError;

      const rolesList = userRoles?.map(r => r.role as AppRole) || ['fan'];
      setRoles(rolesList);

      // Get the highest role
      const { data: highestRoleData, error: highestRoleError } = await supabase
        .rpc('get_user_role', { _user_id: userId });

      if (highestRoleError) throw highestRoleError;

      setHighestRole(highestRoleData || 'fan');
    } catch (err) {
      const errorMessage = 'Failed to fetch user roles';
      setError(errorMessage);
      console.error('Role fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const hasRole = useCallback((role: AppRole): boolean => {
    return roles.includes(role);
  }, [roles]);

  const hasAnyArtistRole = useCallback((): boolean => {
    return roles.some(role => 
      role === 'audius_artist' || 
      role === 'verified_audius_artist' || 
      role === 'platform_artist' || 
      role === 'verified_platform_artist' ||
      role === 'admin'
    );
  }, [roles]);

  const isAudiusArtist = useCallback((): boolean => {
    return roles.some(role => 
      role === 'audius_artist' || 
      role === 'verified_audius_artist'
    );
  }, [roles]);

  const isPlatformArtist = useCallback((): boolean => {
    return roles.some(role => 
      role === 'platform_artist' || 
      role === 'verified_platform_artist'
    );
  }, [roles]);

  const isVerified = useCallback((): boolean => {
    return roles.some(role => 
      role === 'verified_audius_artist' || 
      role === 'verified_platform_artist' ||
      role === 'admin'
    );
  }, [roles]);

  const canAccessCreatorStudio = useCallback((): boolean => {
    return hasAnyArtistRole();
  }, [hasAnyArtistRole]);

  const assignRole = useCallback(async (role: AppRole, metadata?: any) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role,
          metadata
        });

      if (error && !error.message.includes('duplicate key')) {
        throw error;
      }

      fetchRoles();
      
      toast({
        title: "Role Updated",
        description: `Successfully assigned ${role.replace('_', ' ')} role.`,
      });
    } catch (err) {
      console.error('Error assigning role:', err);
      toast({
        title: "Error",
        description: "Failed to assign role.",
        variant: "destructive",
      });
    }
  }, [userId, fetchRoles]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return {
    roles,
    highestRole,
    loading,
    error,
    hasRole,
    hasAnyArtistRole,
    isAudiusArtist,
    isPlatformArtist,
    isVerified,
    canAccessCreatorStudio,
    assignRole,
    refetch: fetchRoles,
  };
};