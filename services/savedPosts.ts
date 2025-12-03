import { supabase } from '@/lib/supabase';
import { FurnitureImage } from '@/types/furniture';

/**
 * Save a post for the current user
 */
export async function savePost(furnitureImageId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('saved_posts')
      .insert({
        user_id: userId,
        furniture_image_id: furnitureImageId,
      });

    if (error) {
      // If it's a duplicate key error, that's okay - post is already saved
      if (error.code === '23505') {
        return { success: true };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to save post' };
  }
}

/**
 * Unsave a post for the current user
 */
export async function unsavePost(furnitureImageId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('saved_posts')
      .delete()
      .eq('user_id', userId)
      .eq('furniture_image_id', furnitureImageId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to unsave post' };
  }
}

/**
 * Check if a post is saved by the current user
 */
export async function isPostSaved(furnitureImageId: string, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('saved_posts')
      .select('id')
      .eq('user_id', userId)
      .eq('furniture_image_id', furnitureImageId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking if post is saved:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking if post is saved:', error);
    return false;
  }
}

/**
 * Get all saved post IDs for the current user
 */
export async function getSavedPostIds(userId: string): Promise<Set<string>> {
  try {
    const { data, error } = await supabase
      .from('saved_posts')
      .select('furniture_image_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching saved post IDs:', error);
      return new Set();
    }

    return new Set(data?.map(item => item.furniture_image_id) || []);
  } catch (error) {
    console.error('Error fetching saved post IDs:', error);
    return new Set();
  }
}

/**
 * Get all saved posts (with full furniture_image data) for the current user
 */
export async function getSavedPosts(userId: string): Promise<FurnitureImage[]> {
  try {
    // Limit to 50 most recent saved posts to reduce egress
    const { data, error } = await supabase
      .from('saved_posts')
      .select(`
        furniture_image_id,
        furniture_images (
          id,
          user_id,
          public_url,
          item,
          style,
          description,
          material,
          color,
          created_at
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching saved posts:', error);
      return [];
    }

    // Extract furniture_images from the nested structure and parse issues if they exist
    const savedPosts: FurnitureImage[] = (data || [])
      .map((item: any) => {
        const img = item.furniture_images;
        if (!img) return null;
        const parsed = { ...img };
        // Only parse issues if the column exists and has data
        if (img.issues !== undefined && img.issues !== null) {
          parsed.issues = typeof img.issues === 'string' ? JSON.parse(img.issues) : img.issues;
        }
        return parsed;
      })
      .filter((img: any) => img !== null);

    // Fetch profile data for all unique user IDs
    const userIds = [...new Set(savedPosts.map(post => post.user_id).filter(Boolean))];
    const profilesMap = new Map();
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', userIds);
      if (profiles) {
        profiles.forEach((profile: any) => {
          profilesMap.set(profile.id, profile);
        });
      }
    }

    // Map profile data to saved posts
    return savedPosts.map(post => {
      const profile = post.user_id ? profilesMap.get(post.user_id) : null;
      return {
        ...post,
        username: profile?.username,
        display_name: profile?.display_name,
        avatar_url: profile?.avatar_url,
      };
    });
  } catch (error) {
    console.error('Error fetching saved posts:', error);
    return [];
  }
}

