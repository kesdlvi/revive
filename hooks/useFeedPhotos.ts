import { supabase } from '@/lib/supabase';
import { FurnitureImage } from '@/types/furniture';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

export function useFeedPhotos(searchQuery: string, activeView: 'feed' | 'camera' | 'profile') {
  const [feedPhotos, setFeedPhotos] = useState<FurnitureImage[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch furniture images from database
  const fetchFeedPhotos = async (searchTerm?: string) => {
    try {
      let query = supabase
        .from('furniture_images')
        .select('id, public_url, user_id, item, style, description, material, color, created_at');

      // If there's a search term, filter by item, style, description, material, or color
      if (searchTerm && searchTerm.trim().length > 0) {
        const searchPattern = `%${searchTerm.trim()}%`;
        query = query.or(
          `item.ilike.${searchPattern},style.ilike.${searchPattern},description.ilike.${searchPattern},material.ilike.${searchPattern},color.ilike.${searchPattern}`
        );
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50); // Limit to 50 most recent images

      if (error) {
        console.error('❌ Error fetching feed photos:', error);
        Alert.alert('Error', `Failed to load feed: ${error.message}`);
      } else {
        // Filter out any images without valid public_url
        const validPhotos = (data || []).filter(photo => photo.public_url && photo.public_url.trim() !== '');
        console.log(`✅ Fetched ${data?.length || 0} photos, ${validPhotos.length} with valid URLs`);
        if (validPhotos.length > 0) {
          console.log('Sample photo:', validPhotos[0]);
        } else if (data && data.length > 0) {
          console.warn('⚠️ Found photos but none have valid public_url:', data);
        }
        setFeedPhotos(validPhotos);
      }
    } catch (error: any) {
      console.error('❌ Exception fetching feed photos:', error);
      Alert.alert('Error', `Failed to load feed: ${error?.message || 'Unknown error'}`);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    const loadFeed = async () => {
      setLoadingFeed(true);
      await fetchFeedPhotos();
      setLoadingFeed(false);
    };

    loadFeed();
  }, []);

  // Search handler with debouncing
  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (activeView === 'feed') {
        setLoadingFeed(true);
        fetchFeedPhotos(searchQuery).finally(() => {
          setLoadingFeed(false);
        });
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(searchTimeout);
  }, [searchQuery, activeView]);

  // Pull to refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFeedPhotos(searchQuery);
    setRefreshing(false);
  };

  return {
    feedPhotos,
    loadingFeed,
    refreshing,
    onRefresh,
    fetchFeedPhotos,
  };
}

