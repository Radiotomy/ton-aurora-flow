import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useWalletStore } from '@/stores/walletStore';
import { useAuth } from '@/hooks/useAuth';
import { useWeb3 } from '@/hooks/useWeb3';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Music, Upload, Save, X } from 'lucide-react';

interface ProfileEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfileEditModal = ({ open, onOpenChange }: ProfileEditModalProps) => {
  const { profile } = useWalletStore();
  const { user } = useAuth();
  const { updateTonDnsName } = useWeb3();
  
  const [formData, setFormData] = useState({
    display_name: profile?.display_name || user?.email?.split('@')[0] || '',
    bio: profile?.bio || '',
    ton_dns_name: profile?.ton_dns_name || '',
    avatar_url: profile?.avatar_url || '',
  });
  
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!profile?.id) {
        toast.error('Profile not found');
        return;
      }

      // Update profile in database
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: formData.display_name,
          bio: formData.bio,
          avatar_url: formData.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;

      // Update TON DNS name if changed
      if (formData.ton_dns_name !== profile.ton_dns_name) {
        await updateTonDnsName(formData.ton_dns_name);
      }

      // Update local store
      useWalletStore.getState().setProfile({
        ...profile,
        display_name: formData.display_name,
        bio: formData.bio,
        avatar_url: formData.avatar_url,
        ton_dns_name: formData.ton_dns_name,
      });

      toast.success('Profile updated successfully! ✨');
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass-panel">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-aurora">
            <Music className="h-5 w-5" />
            Edit Profile
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={formData.avatar_url} />
              <AvatarFallback>
                <Music className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            
            <div className="w-full space-y-2">
              <Label htmlFor="avatar_url">Avatar URL</Label>
              <div className="flex gap-2">
                <Input
                  id="avatar_url"
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={formData.avatar_url}
                  onChange={(e) => handleInputChange('avatar_url', e.target.value)}
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="display_name">Display Name</Label>
            <Input
              id="display_name"
              placeholder="Your display name"
              value={formData.display_name}
              onChange={(e) => handleInputChange('display_name', e.target.value)}
              required
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself..."
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              rows={3}
            />
          </div>

          {/* TON DNS Name */}
          <div className="space-y-2">
            <Label htmlFor="ton_dns_name">TON DNS Name</Label>
            <div className="flex gap-2">
              <Input
                id="ton_dns_name"
                placeholder="yourname"
                value={formData.ton_dns_name}
                onChange={(e) => handleInputChange('ton_dns_name', e.target.value)}
                className="flex-1"
              />
              <span className="flex items-center text-sm text-muted-foreground">.ton</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Your custom TON DNS name for easy identification
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};