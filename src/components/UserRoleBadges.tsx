import React from 'react';
import { Badge } from './ui/badge';
import { useUserRoles, AppRole } from '@/hooks/useUserRoles';
import { Crown, Music, Star, Shield, User, CheckCircle } from 'lucide-react';

interface UserRoleBadgesProps {
  userId?: string;
  showAllRoles?: boolean;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

const roleConfig: Record<AppRole, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  priority: number;
}> = {
  'admin': {
    label: 'Admin',
    icon: Shield,
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
    priority: 100
  },
  'verified_platform_artist': {
    label: 'Verified Platform Artist',
    icon: Crown,
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    priority: 90
  },
  'verified_audius_artist': {
    label: 'Verified Audius Artist',
    icon: CheckCircle,
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    priority: 80
  },
  'platform_artist': {
    label: 'Platform Artist',
    icon: Music,
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    priority: 70
  },
  'audius_artist': {
    label: 'Audius Artist',
    icon: Star,
    color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    priority: 60
  },
  'fan': {
    label: 'Fan',
    icon: User,
    color: 'bg-muted/50 text-muted-foreground border-muted',
    priority: 10
  }
};

export const UserRoleBadges: React.FC<UserRoleBadgesProps> = ({
  userId,
  showAllRoles = false,
  variant = 'outline',
  size = 'sm',
}) => {
  const { roles, highestRole, loading } = useUserRoles(userId);

  if (loading) {
    return (
      <div className="flex gap-1">
        <div className="h-5 w-12 bg-muted/50 rounded animate-pulse" />
      </div>
    );
  }

  if (!roles.length) {
    return null;
  }

  // Filter out 'fan' role if user has other roles
  const displayRoles = showAllRoles 
    ? roles 
    : roles.filter(role => role !== 'fan' || roles.length === 1);

  // Sort roles by priority (highest first)
  const sortedRoles = displayRoles.sort((a, b) => 
    roleConfig[b].priority - roleConfig[a].priority
  );

  // If not showing all roles, only show the highest priority role
  const rolesToShow = showAllRoles ? sortedRoles : sortedRoles.slice(0, 1);

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className="flex gap-1 flex-wrap">
      {rolesToShow.map((role) => {
        const config = roleConfig[role];
        const IconComponent = config.icon;
        
        return (
          <Badge
            key={role}
            variant={variant}
            className={`flex items-center gap-1 ${config.color}`}
          >
            <IconComponent className={iconSizeClasses[size]} />
            <span className="text-xs font-medium">
              {config.label}
            </span>
          </Badge>
        );
      })}
    </div>
  );
};

interface RoleStatusProps {
  userId?: string;
  compact?: boolean;
}

export const RoleStatus: React.FC<RoleStatusProps> = ({
  userId,
  compact = false,
}) => {
  const { hasAnyArtistRole, isVerified, highestRole, loading } = useUserRoles(userId);

  if (loading || !userId) return null;

  if (compact) {
    return <UserRoleBadges userId={userId} showAllRoles={false} size="sm" />;
  }

  return (
    <div className="flex items-center gap-2">
      <UserRoleBadges userId={userId} showAllRoles={false} />
      
      {hasAnyArtistRole() && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Music className="w-3 h-3" />
          <span>Creator</span>
        </div>
      )}
      
      {isVerified() && (
        <div className="flex items-center gap-1 text-xs text-blue-400">
          <CheckCircle className="w-3 h-3" />
          <span>Verified</span>
        </div>
      )}
    </div>
  );
};