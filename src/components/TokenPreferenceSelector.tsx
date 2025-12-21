import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Coins, Music, RefreshCw, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TokenPreferenceSelectorProps {
  onPreferenceChange?: (token: 'AUDIO' | 'TON') => void;
  compact?: boolean;
  showConversion?: boolean;
}

const SUPABASE_URL = 'https://cpjjaglmqvcwpzrdoyul.supabase.co';

// Reward amounts in both tokens
const REWARD_EQUIVALENTS = {
  welcome_bonus: { AUDIO: 50, TON: 0.26 },
  referral: { AUDIO: 25, TON: 0.13 },
  first_tip: { AUDIO: 15, TON: 0.08 },
  first_mint: { AUDIO: 20, TON: 0.11 },
};

export const TokenPreferenceSelector = ({ 
  onPreferenceChange, 
  compact = false,
  showConversion = true 
}: TokenPreferenceSelectorProps) => {
  const [preference, setPreference] = useState<'AUDIO' | 'TON'>('AUDIO');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const fetchPreference = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/distribute-rewards?action=get-preference`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          }
        }
      );

      const data = await response.json();
      if (data.preferred_token) {
        setPreference(data.preferred_token);
      }
    } catch (error) {
      console.error('[TokenPreferenceSelector] Failed to fetch preference:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreference();
  }, [fetchPreference]);

  const handlePreferenceChange = async (newPreference: 'AUDIO' | 'TON') => {
    setPreference(newPreference);
    setIsSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Not authenticated",
          description: "Please sign in to save your preference",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/distribute-rewards?action=set-preference`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ preferred_token: newPreference })
        }
      );

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Preference saved",
          description: `You'll now receive rewards in ${newPreference}`,
        });
        onPreferenceChange?.(newPreference);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('[TokenPreferenceSelector] Failed to save preference:', error);
      toast({
        title: "Failed to save",
        description: "Could not update your token preference",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span>Loading preference...</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Rewards in:</span>
        <div className="flex gap-1">
          <Button
            variant={preference === 'AUDIO' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePreferenceChange('AUDIO')}
            disabled={isSaving}
            className="h-7 px-2"
          >
            <Music className="w-3 h-3 mr-1" />
            AUDIO
          </Button>
          <Button
            variant={preference === 'TON' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePreferenceChange('TON')}
            disabled={isSaving}
            className="h-7 px-2"
          >
            <Coins className="w-3 h-3 mr-1" />
            TON
          </Button>
        </div>
        {isSaving && <RefreshCw className="w-3 h-3 animate-spin text-muted-foreground" />}
      </div>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Coins className="w-5 h-5 text-primary" />
          Reward Token Preference
        </CardTitle>
        <CardDescription>
          Choose which token you'd like to receive for rewards and bonuses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup 
          value={preference} 
          onValueChange={(value) => handlePreferenceChange(value as 'AUDIO' | 'TON')}
          disabled={isSaving}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* AUDIO Option */}
          <Label
            htmlFor="audio"
            className={`flex flex-col gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
              preference === 'AUDIO' 
                ? 'border-primary bg-primary/10' 
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <RadioGroupItem value="AUDIO" id="audio" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Music className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="font-semibold">$AUDIO</span>
                  <Badge variant="outline" className="ml-2 text-xs">Audius Token</Badge>
                </div>
              </div>
              {preference === 'AUDIO' && <Check className="w-4 h-4 text-primary ml-auto" />}
            </div>
            {showConversion && (
              <div className="text-xs text-muted-foreground pl-8 space-y-1">
                <p>• Welcome Bonus: {REWARD_EQUIVALENTS.welcome_bonus.AUDIO} $AUDIO</p>
                <p>• Referral Reward: {REWARD_EQUIVALENTS.referral.AUDIO} $AUDIO</p>
                <p>• Use for streaming rewards & fan engagement</p>
              </div>
            )}
          </Label>

          {/* TON Option */}
          <Label
            htmlFor="ton"
            className={`flex flex-col gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
              preference === 'TON' 
                ? 'border-primary bg-primary/10' 
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <RadioGroupItem value="TON" id="ton" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Coins className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="font-semibold">TON</span>
                  <Badge variant="outline" className="ml-2 text-xs">Toncoin</Badge>
                </div>
              </div>
              {preference === 'TON' && <Check className="w-4 h-4 text-primary ml-auto" />}
            </div>
            {showConversion && (
              <div className="text-xs text-muted-foreground pl-8 space-y-1">
                <p>• Welcome Bonus: {REWARD_EQUIVALENTS.welcome_bonus.TON} TON</p>
                <p>• Referral Reward: {REWARD_EQUIVALENTS.referral.TON} TON</p>
                <p>• Use for NFT purchases & on-chain activities</p>
              </div>
            )}
          </Label>
        </RadioGroup>

        {isSaving && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Saving preference...
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Your preference applies to all future rewards. You can change it anytime.
        </p>
      </CardContent>
    </Card>
  );
};

// Hook for getting user's token preference
export const useTokenPreference = () => {
  const [preference, setPreference] = useState<'AUDIO' | 'TON'>('AUDIO');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPreference = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setIsLoading(false);
          return;
        }

        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/distribute-rewards?action=get-preference`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            }
          }
        );

        const data = await response.json();
        if (data.preferred_token) {
          setPreference(data.preferred_token);
        }
      } catch (error) {
        console.error('[useTokenPreference] Failed to fetch:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreference();
  }, []);

  return { preference, isLoading };
};

export default TokenPreferenceSelector;
