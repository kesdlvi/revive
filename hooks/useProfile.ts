import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function useProfile() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<{ username?: string; avatar_url?: string } | null>(null);

  // Fetch profile data when user is available
  const fetchProfile = async () => {
    if (user?.id) {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfileData(data);
      }
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user?.id]);

  return { profileData, refetchProfile: fetchProfile };
}

