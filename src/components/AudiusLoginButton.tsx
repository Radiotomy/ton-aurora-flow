import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Music, LogOut, User, Heart, List } from 'lucide-react';
import { useAudiusAuth } from '@/hooks/useAudiusAuth';
import { AudiusService } from '@/services/audiusService';

export const AudiusLoginButton: React.FC = () => {
  const { user, isAuthenticated, loading, login, logout } = useAudiusAuth();

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Music className="w-4 h-4 animate-pulse" />
      </Button>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={login}
        className="gap-2"
      >
        <Music className="w-4 h-4" />
        Connect Audius
      </Button>
    );
  }

  const profilePictureUrl = AudiusService.getProfilePictureUrl(user.profile_picture);
  const initials = user.name?.charAt(0)?.toUpperCase() || 'A';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-2">
          <Avatar className="w-6 h-6">
            <AvatarImage 
              src={profilePictureUrl} 
              alt={user.name || 'User'} 
            />
            <AvatarFallback className="text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline text-sm font-medium">
            {user.name}
          </span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">@{user.handle}</p>
          {user.follower_count !== undefined && (
            <p className="text-xs text-muted-foreground">
              {user.follower_count.toLocaleString()} followers
            </p>
          )}
        </div>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="gap-2">
          <User className="w-4 h-4" />
          View Profile
        </DropdownMenuItem>
        
        <DropdownMenuItem className="gap-2">
          <Heart className="w-4 h-4" />
          My Favorites
        </DropdownMenuItem>
        
        <DropdownMenuItem className="gap-2">
          <List className="w-4 h-4" />
          My Playlists
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={logout}
          className="gap-2 text-destructive focus:text-destructive"
        >
          <LogOut className="w-4 h-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};