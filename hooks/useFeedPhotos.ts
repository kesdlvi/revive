import { supabase } from '@/lib/supabase';
import { FurnitureImage } from '@/types/furniture';
import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

export function useFeedPhotos(searchQuery: string, activeView: 'feed' | 'camera' | 'profile') {
  const [feedPhotos, setFeedPhotos] = useState<FurnitureImage[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasInitiallyLoaded = useRef(false);
  const previousSearchQuery = useRef<string>('');

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
          `item.ilike."${searchPattern}",style.ilike."${searchPattern}",description.ilike."${searchPattern}",material.ilike."${searchPattern}",color.ilike."${searchPattern}"`
        );
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(30); // Limit to 30 most recent images to reduce egress

      if (error) {
        console.error('❌ Error fetching feed photos:', error);
        Alert.alert('Error', `Failed to load feed: ${error.message}`);
      } else {
        // Filter out any images without valid public_url
        const validPhotos = (data || []).filter(photo => photo.public_url && photo.public_url.trim() !== '');
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

  // Initial fetch on mount (only once)
  useEffect(() => {
    const loadFeed = async () => {
      if (hasInitiallyLoaded.current) return;
      
      setLoadingFeed(true);
      await fetchFeedPhotos();
      setLoadingFeed(false);
      hasInitiallyLoaded.current = true;
      previousSearchQuery.current = searchQuery;
    };

    loadFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Search handler with debouncing (only refetch when search query actually changes)
  useEffect(() => {
    // Skip if initial load hasn't happened yet
    if (!hasInitiallyLoaded.current) return;
    
    // Skip if search query hasn't actually changed
    if (previousSearchQuery.current === searchQuery) return;

    const searchTimeout = setTimeout(() => {
      // Only refetch if we're on the feed view (to avoid unnecessary requests)
      if (activeView === 'feed') {
        setLoadingFeed(true);
        fetchFeedPhotos(searchQuery).finally(() => {
          setLoadingFeed(false);
        });
      }
      previousSearchQuery.current = searchQuery;
    }, 500); // 500ms debounce

    return () => clearTimeout(searchTimeout);
  }, [searchQuery, activeView]); // Include both, but we check if searchQuery actually changed

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

