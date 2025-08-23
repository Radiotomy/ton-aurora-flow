import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useAudiusAuth } from '@/hooks/useAudiusAuth';

const AudiusCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleOAuthCallback } = useAudiusAuth();
  const [status, setStatus] = React.useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = React.useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setMessage(`Authentication failed: ${error}`);
        setTimeout(() => navigate('/'), 3000);
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setMessage('Invalid callback parameters');
        setTimeout(() => navigate('/'), 3000);
        return;
      }

      try {
        await handleOAuthCallback(code, state);
        setStatus('success');
        setMessage('Successfully connected to Audius!');
        setTimeout(() => navigate('/'), 2000);
      } catch (error) {
        setStatus('error');
        setMessage('Failed to complete authentication');
        setTimeout(() => navigate('/'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, handleOAuthCallback, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'loading' && <Loader2 className="w-12 h-12 animate-spin text-primary" />}
            {status === 'success' && <CheckCircle className="w-12 h-12 text-green-500" />}
            {status === 'error' && <XCircle className="w-12 h-12 text-destructive" />}
          </div>
          
          <h1 className="text-xl font-semibold">
            {status === 'loading' && 'Connecting to Audius...'}
            {status === 'success' && 'Authentication Successful!'}
            {status === 'error' && 'Authentication Failed'}
          </h1>
        </CardHeader>
        
        <CardContent className="text-center">
          <p className="text-muted-foreground">{message}</p>
          {status !== 'loading' && (
            <p className="text-sm text-muted-foreground mt-2">
              Redirecting you back to AudioTon...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AudiusCallback;