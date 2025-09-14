import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Music } from 'lucide-react';

const Auth = () => {
  const { signIn, signUp, resetPassword, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [activeTab, setActiveTab] = useState('signin');

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await signIn(email, password);
    if (!error) {
      navigate('/');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return;
    }
    
    const { error } = await signUp(email, password, {
      display_name: displayName || email.split('@')[0]
    });
    
    if (!error) {
      setActiveTab('signin');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    await resetPassword(resetEmail);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-subtle">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <Music className="h-8 w-8 text-primary mr-2" />
          <h1 className="text-2xl font-bold text-aurora">AudioTon</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 glass-panel">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <Card className="glass-panel border-glass">
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>
                  Sign in to your AudioTon account to continue your musical journey.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    variant="aurora"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
                
                <div className="mt-4 text-center">
                  <Button
                    variant="ghost"
                    onClick={() => setActiveTab('reset')}
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    Forgot your password?
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card className="glass-panel border-glass">
              <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>
                  Join AudioTon and discover the future of Web3 music.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Display Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="How should we call you?"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    variant="aurora"
                    disabled={loading || password !== confirmPassword}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              </CardContent>
              
              {/* Call-to-action for artists */}
              <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-lg p-4 mx-6 mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="font-medium">Are you an artist?</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Join AudioTon as an artist and unlock Web3 music features, fan clubs, and monetization tools.
                </p>
                <div className="flex gap-2">
                  {isAudiusAuthenticated ? (
                    <Button size="sm" onClick={() => setShowArtistModal(true)}>
                      Apply as Artist
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <AudiusLoginButton />
                      <span className="text-xs text-muted-foreground">or</span>
                      <Button size="sm" variant="outline" onClick={() => setShowArtistModal(true)}>
                        Register New Artist
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="reset">
            <Card className="glass-panel border-glass">
              <CardHeader>
                <CardTitle>Reset Password</CardTitle>
                <CardDescription>
                  Enter your email to receive password reset instructions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="Enter your email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    variant="aurora"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Reset Email'
                    )}
                  </Button>
                </form>
                
                <div className="mt-4 text-center">
                  <Button
                    variant="ghost"
                    onClick={() => setActiveTab('signin')}
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    Back to Sign In
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Artist Registration Modal */}
        <ArtistRegistrationModal 
          open={showArtistModal} 
          onOpenChange={setShowArtistModal} 
        />
      </div>
    </div>
  );
};

export default Auth;