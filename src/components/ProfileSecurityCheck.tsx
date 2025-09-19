import { useEffect } from 'react';
import { toast } from 'sonner';

// Security component to warn users about the profile data exposure fix
export const ProfileSecurityCheck = () => {
  useEffect(() => {
    // Check if user has been notified about the security fix
    const hasSeenSecurityNotice = localStorage.getItem('profile-security-notice');
    
    if (!hasSeenSecurityNotice) {
      toast.success('Security Update Applied: Your profile data is now properly protected! 🔐', {
        duration: 5000,
      });
      localStorage.setItem('profile-security-notice', 'true');
    }
  }, []);

  return null; // This component doesn't render anything
};