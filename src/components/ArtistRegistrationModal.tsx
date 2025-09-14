import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Music, 
  User, 
  Check, 
  Upload, 
  ExternalLink, 
  AlertCircle,
  Sparkles,
  Crown,
  Globe
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAudiusAuth } from '@/hooks/useAudiusAuth';
import { AudiusLoginButton } from '@/components/AudiusLoginButton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ArtistRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ArtistApplicationData {
  applicationType: 'audius_artist' | 'platform_artist';
  // Basic Info
  stageName: string;
  realName: string;
  bio: string;
  genres: string[];
  location: string;
  website: string;
  socialLinks: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
    spotify?: string;
    soundcloud?: string;
  };
  // Audius-specific
  audiusHandle?: string;
  audiusUserId?: string;
  // Portfolio
  portfolioDescription: string;
  experienceLevel: 'beginner' | 'intermediate' | 'professional' | 'established';
  achievements: string;
  // Verification documents
  verificationDocuments: File[];
}

export const ArtistRegistrationModal: React.FC<ArtistRegistrationModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { profile } = useAuth();
  const { isAuthenticated: isAudiusAuthenticated, user: audiusUser } = useAudiusAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState<'choose' | 'audius' | 'platform' | 'review' | 'submitting' | 'success'>('choose');
  const [applicationData, setApplicationData] = useState<ArtistApplicationData>({
    applicationType: 'platform_artist',
    stageName: '',
    realName: '',
    bio: '',
    genres: [],
    location: '',
    website: '',
    socialLinks: {},
    portfolioDescription: '',
    experienceLevel: 'beginner',
    achievements: '',
    verificationDocuments: [],
  });
  const [uploadProgress, setUploadProgress] = useState(0);

  const genres = [
    'Electronic', 'Hip Hop', 'Pop', 'Rock', 'Jazz', 'Classical', 'R&B', 'Country',
    'Reggae', 'Folk', 'Blues', 'Punk', 'Metal', 'Indie', 'Alternative', 'Funk',
    'House', 'Techno', 'Trance', 'Dubstep', 'Ambient', 'Lo-Fi', 'Trap', 'Other'
  ];

  const handleChooseAudiusPath = () => {
    setApplicationData(prev => ({ 
      ...prev, 
      applicationType: 'audius_artist',
      stageName: audiusUser?.name || '',
      audiusHandle: audiusUser?.handle || '',
      audiusUserId: audiusUser?.id || '',
    }));
    setStep('audius');
  };

  const handleChoosePlatformPath = () => {
    setApplicationData(prev => ({ ...prev, applicationType: 'platform_artist' }));
    setStep('platform');
  };

  const handleInputChange = (field: keyof ArtistApplicationData, value: any) => {
    setApplicationData(prev => ({ ...prev, [field]: value }));
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setApplicationData(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: value }
    }));
  };

  const handleGenreToggle = (genre: string) => {
    setApplicationData(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre].slice(0, 5) // Max 5 genres
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setApplicationData(prev => ({
      ...prev,
      verificationDocuments: [...prev.verificationDocuments, ...files].slice(0, 5)
    }));
  };

  const removeFile = (index: number) => {
    setApplicationData(prev => ({
      ...prev,
      verificationDocuments: prev.verificationDocuments.filter((_, i) => i !== index)
    }));
  };

  const validateStep = () => {
    if (step === 'audius') {
      return applicationData.stageName && applicationData.bio && applicationData.genres.length > 0;
    }
    if (step === 'platform') {
      return applicationData.stageName && applicationData.realName && applicationData.bio && 
             applicationData.genres.length > 0 && applicationData.portfolioDescription;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    setStep('review');
  };

  const handleSubmitApplication = async () => {
    if (!profile) return;

    setStep('submitting');
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Prepare application data for database
      const dbData = {
        profile_id: profile.id,
        application_type: applicationData.applicationType,
        audius_user_id: applicationData.audiusUserId,
        audius_handle: applicationData.audiusHandle,
        audius_verification_data: isAudiusAuthenticated ? {
          user_id: audiusUser?.id,
          handle: audiusUser?.handle,
          name: audiusUser?.name,
          verified: audiusUser?.is_verified,
          follower_count: audiusUser?.follower_count,
          track_count: audiusUser?.track_count,
        } : null,
        platform_portfolio: {
          stage_name: applicationData.stageName,
          real_name: applicationData.realName,
          bio: applicationData.bio,
          genres: applicationData.genres,
          location: applicationData.location,
          website: applicationData.website,
          social_links: applicationData.socialLinks,
          portfolio_description: applicationData.portfolioDescription,
          experience_level: applicationData.experienceLevel,
          achievements: applicationData.achievements,
        },
        status: 'pending',
      };

      // Submit application
      const { error } = await supabase
        .from('artist_applications')
        .insert([dbData]);

      if (error) throw error;

      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setStep('success');
        toast({
          title: "Application Submitted!",
          description: "Your artist application has been submitted for review. We'll notify you once it's processed.",
        });
      }, 500);

    } catch (error) {
      console.error('Application submission error:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
      setStep('review');
    }
  };

  const resetForm = () => {
    setStep('choose');
    setApplicationData({
      applicationType: 'platform_artist',
      stageName: '',
      realName: '',
      bio: '',
      genres: [],
      location: '',
      website: '',
      socialLinks: {},
      portfolioDescription: '',
      experienceLevel: 'beginner',
      achievements: '',
      verificationDocuments: [],
    });
    setUploadProgress(0);
  };

  const handleClose = () => {
    if (step !== 'submitting') {
      resetForm();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Become an AudioTon Artist
          </DialogTitle>
        </DialogHeader>

        {step === 'choose' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Choose Your Artist Path</h3>
              <p className="text-muted-foreground">
                Join AudioTon as an artist and start building your Web3 music career
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Audius Artist Path */}
              <Card className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary/50">
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Globe className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="flex items-center justify-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-500" />
                    Audius Artist
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Connect existing Audius profile</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Import your tracks & followers</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Faster verification process</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Cross-platform features</span>
                    </div>
                  </div>

                  {isAudiusAuthenticated ? (
                    <Button onClick={handleChooseAudiusPath} className="w-full">
                      Continue as {audiusUser?.name}
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground text-center">
                        Connect your Audius account first
                      </p>
                      <AudiusLoginButton />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Platform Artist Path */}
              <Card className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary/50">
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle>AudioTon Artist</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Start fresh on AudioTon</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Full Web3 features</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>TON blockchain integration</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>NFT & Fan club features</span>
                    </div>
                  </div>

                  <Button onClick={handleChoosePlatformPath} variant="outline" className="w-full">
                    Register as New Artist
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {step === 'audius' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-lg">
              <Globe className="w-8 h-8 text-primary" />
              <div>
                <h3 className="font-medium">Audius Artist Registration</h3>
                <p className="text-sm text-muted-foreground">
                  Complete your profile using your connected Audius account
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="stage-name">Stage Name *</Label>
                <Input
                  id="stage-name"
                  value={applicationData.stageName}
                  onChange={(e) => handleInputChange('stageName', e.target.value)}
                  placeholder="Your artist name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={applicationData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="City, Country"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Artist Bio *</Label>
              <Textarea
                id="bio"
                value={applicationData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell us about your music and journey..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Genres * (Select up to 5)</Label>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {genres.map((genre) => (
                  <Badge
                    key={genre}
                    variant={applicationData.genres.includes(genre) ? "default" : "outline"}
                    className="cursor-pointer justify-center"
                    onClick={() => handleGenreToggle(genre)}
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={applicationData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://yourwebsite.com"
              />
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('choose')}>
                Back
              </Button>
              <Button onClick={handleNext} disabled={!validateStep()}>
                Review Application
              </Button>
            </div>
          </div>
        )}

        {step === 'platform' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-lg">
              <Sparkles className="w-8 h-8 text-primary" />
              <div>
                <h3 className="font-medium">AudioTon Artist Registration</h3>
                <p className="text-sm text-muted-foreground">
                  Create your artist profile from scratch
                </p>
              </div>
            </div>

            <Tabs defaultValue="basic" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                <TabsTrigger value="social">Social Links</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stage-name">Stage Name *</Label>
                    <Input
                      id="stage-name"
                      value={applicationData.stageName}
                      onChange={(e) => handleInputChange('stageName', e.target.value)}
                      placeholder="Your artist name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="real-name">Real Name *</Label>
                    <Input
                      id="real-name"
                      value={applicationData.realName}
                      onChange={(e) => handleInputChange('realName', e.target.value)}
                      placeholder="Your legal name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Artist Bio *</Label>
                  <Textarea
                    id="bio"
                    value={applicationData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Tell us about your music and journey..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={applicationData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="City, Country"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experience">Experience Level</Label>
                    <Select
                      value={applicationData.experienceLevel}
                      onValueChange={(value: any) => handleInputChange('experienceLevel', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner (0-2 years)</SelectItem>
                        <SelectItem value="intermediate">Intermediate (2-5 years)</SelectItem>
                        <SelectItem value="professional">Professional (5+ years)</SelectItem>
                        <SelectItem value="established">Established Artist</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Genres * (Select up to 5)</Label>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {genres.map((genre) => (
                      <Badge
                        key={genre}
                        variant={applicationData.genres.includes(genre) ? "default" : "outline"}
                        className="cursor-pointer justify-center"
                        onClick={() => handleGenreToggle(genre)}
                      >
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="portfolio" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="portfolio">Portfolio Description *</Label>
                  <Textarea
                    id="portfolio"
                    value={applicationData.portfolioDescription}
                    onChange={(e) => handleInputChange('portfolioDescription', e.target.value)}
                    placeholder="Describe your musical background, influences, and what makes your music unique..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="achievements">Achievements & Recognition</Label>
                  <Textarea
                    id="achievements"
                    value={applicationData.achievements}
                    onChange={(e) => handleInputChange('achievements', e.target.value)}
                    placeholder="List any awards, notable performances, collaborations, or recognition..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Verification Documents (Optional)</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Upload press coverage, certificates, or other verification materials
                      </p>
                      <Button variant="outline" size="sm" asChild>
                        <label htmlFor="file-upload" className="cursor-pointer">
                          Choose Files
                        </label>
                      </Button>
                    </div>
                  </div>
                  
                  {applicationData.verificationDocuments.length > 0 && (
                    <div className="space-y-2">
                      {applicationData.verificationDocuments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm">{file.name}</span>
                          <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="social" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={applicationData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://yourwebsite.com"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      value={applicationData.socialLinks.instagram || ''}
                      onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                      placeholder="@username"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter/X</Label>
                    <Input
                      id="twitter"
                      value={applicationData.socialLinks.twitter || ''}
                      onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                      placeholder="@username"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="youtube">YouTube</Label>
                    <Input
                      id="youtube"
                      value={applicationData.socialLinks.youtube || ''}
                      onChange={(e) => handleSocialLinkChange('youtube', e.target.value)}
                      placeholder="Channel URL or @handle"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="spotify">Spotify</Label>
                    <Input
                      id="spotify"
                      value={applicationData.socialLinks.spotify || ''}
                      onChange={(e) => handleSocialLinkChange('spotify', e.target.value)}
                      placeholder="Artist profile URL"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="soundcloud">SoundCloud</Label>
                    <Input
                      id="soundcloud"
                      value={applicationData.socialLinks.soundcloud || ''}
                      onChange={(e) => handleSocialLinkChange('soundcloud', e.target.value)}
                      placeholder="Profile URL"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('choose')}>
                Back
              </Button>
              <Button onClick={handleNext} disabled={!validateStep()}>
                Review Application
              </Button>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Review Your Application</h3>
              <p className="text-muted-foreground">
                Please review your information before submitting
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {applicationData.applicationType === 'audius_artist' ? (
                    <>
                      <Globe className="w-5 h-5" />
                      Audius Artist Application
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      AudioTon Artist Application
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Stage Name</Label>
                    <p className="font-medium">{applicationData.stageName}</p>
                  </div>
                  {applicationData.realName && (
                    <div>
                      <Label className="text-muted-foreground">Real Name</Label>
                      <p className="font-medium">{applicationData.realName}</p>
                    </div>
                  )}
                  {applicationData.location && (
                    <div>
                      <Label className="text-muted-foreground">Location</Label>
                      <p className="font-medium">{applicationData.location}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-muted-foreground">Experience Level</Label>
                    <p className="font-medium capitalize">{applicationData.experienceLevel}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Bio</Label>
                  <p className="text-sm">{applicationData.bio}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Genres</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {applicationData.genres.map((genre) => (
                      <Badge key={genre} variant="secondary">{genre}</Badge>
                    ))}
                  </div>
                </div>

                {applicationData.portfolioDescription && (
                  <div>
                    <Label className="text-muted-foreground">Portfolio</Label>
                    <p className="text-sm">{applicationData.portfolioDescription}</p>
                  </div>
                )}

                {applicationData.verificationDocuments.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground">Verification Documents</Label>
                    <p className="text-sm">{applicationData.verificationDocuments.length} files uploaded</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(applicationData.applicationType === 'audius_artist' ? 'audius' : 'platform')}>
                Back to Edit
              </Button>
              <Button onClick={handleSubmitApplication}>
                Submit Application
              </Button>
            </div>
          </div>
        )}

        {step === 'submitting' && (
          <div className="space-y-6 text-center py-8">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Upload className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Submitting Your Application...</h3>
              <p className="text-muted-foreground mb-4">
                Please wait while we process your artist application.
              </p>
            </div>
            <div className="space-y-2">
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                {uploadProgress}% complete
              </p>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-6 text-center py-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Application Submitted!</h3>
              <p className="text-muted-foreground mb-4">
                Your artist application has been submitted successfully. Our team will review it and get back to you within 2-3 business days.
              </p>
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>What happens next?</span>
                </div>
                <ul className="text-sm text-left space-y-1">
                  <li>• Our team will review your application and portfolio</li>
                  <li>• We may reach out for additional information if needed</li>
                  <li>• You'll receive an email notification with the decision</li>
                  <li>• Once approved, you'll gain access to all artist features</li>
                </ul>
              </div>
            </div>
            <div className="flex justify-center gap-3">
              <Button onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};