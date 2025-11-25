import { supabase } from '@/lib/supabase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Extract tokens from URL parameters
        const accessToken = params.access_token as string;
        const refreshToken = params.refresh_token as string;

        if (accessToken && refreshToken) {
          // Set the session with the tokens
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Error setting session:', error);
            router.replace('/auth/sign-in');
          } else {
            // Successfully authenticated, redirect to home
            router.replace('/(tabs)');
          }
        } else {
          // Wait a moment for Supabase to process the callback
          // Then check if session was set automatically
          setTimeout(async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (session && !error) {
              router.replace('/(tabs)');
            } else {
              // No tokens found, redirect to sign-in
              router.replace('/auth/sign-in');
            }
          }, 1000);
        }
      } catch (error) {
        console.error('Callback error:', error);
        router.replace('/auth/sign-in');
      }
    };

    handleCallback();
  }, [params, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

