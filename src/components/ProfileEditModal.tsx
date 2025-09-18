import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/ImageUpload';
import { useWalletStore } from '@/stores/walletStore';
import { useAuth } from '@/hooks/useAuth';
import { useWeb3 } from '@/hooks/useWeb3';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Music, Save, X } from 'lucide-react';

interface ProfileEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfileEditModal = ({ open, onOpenChange }: ProfileEditModalProps) => {
  const { profile } = useWalletStore();
  const { user } = useAuth();
  const { updateTonDnsName } = useWeb3();
  
  // Memoize initial form data to prevent unnecessary re-renders
  const initialFormData = useMemo(() => ({
    display_name: profile?.display_name || user?.email?.split('@')[0] || '',
    bio: profile?.bio || '',
    ton_dns_name: profile?.ton_dns_name || '',
    avatar_url: profile?.avatar_url || '',
  }), [profile?.display_name, profile?.bio, profile?.ton_dns_name, profile?.avatar_url, user?.email]);
  
  const [formData, setFormData] = useState(initialFormData);
  const [isLoading, setIsLoading] = useState(false);

  // Update form data when profile changes or modal opens
  useEffect(() => {
    if (open) {
      setFormData(initialFormData);
    }
  }, [open, initialFormData]);

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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-md border border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-aurora">
            <Music className="h-5 w-5" />
            Edit Profile
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Avatar Section */}
          <ImageUpload
            value={formData.avatar_url}
            onChange={(url) => handleInputChange('avatar_url', url)}
            label="Profile Avatar"
            placeholder="https://example.com/avatar.jpg"
            type="avatar"
          />

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="display_name" className="text-sm font-medium">Display Name</Label>
            <Input
              id="display_name"
              placeholder="Your display name"
              value={formData.display_name}
              onChange={(e) => handleInputChange('display_name', e.target.value)}
              className="bg-background/50"
              required
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-sm font-medium">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself..."
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              className="bg-background/50 min-h-[80px] resize-none"
              rows={3}
            />
          </div>

          {/* TON DNS Name */}
          <div className="space-y-2">
            <Label htmlFor="ton_dns_name" className="text-sm font-medium">TON DNS Name</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="ton_dns_name"
                placeholder="yourname"
                value={formData.ton_dns_name}
                onChange={(e) => handleInputChange('ton_dns_name', e.target.value)}
                className="flex-1 bg-background/50"
              />
              <span className="text-sm text-muted-foreground shrink-0">.ton</span>
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