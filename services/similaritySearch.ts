import { supabase } from '@/lib/supabase';
import { FurnitureImage } from '@/types/furniture';
import { generateEmbedding } from './openai';

/**
 * Search for similar furniture images using vector embeddings
 * Falls back to text-based matching if embeddings are not available
 */
export async function searchSimilarImages(
  analysis: { item?: string; style?: string; material?: string; description?: string },
  limit: number = 20,
  threshold: number = 0.5 // Lower threshold to get more results
): Promise<FurnitureImage[]> {
  try {
    // Try vector similarity search first (if embeddings are available)
    try {
      console.log('🔍 Starting similarity search for:', analysis.item || 'unknown item');
      // Generate embedding from analysis
      const embedding = await generateEmbedding(analysis);
      
      // Query Supabase RPC function for similar images
      const { data, error } = await supabase.rpc('match_furniture_images', {
        query_embedding: embedding,
        match_threshold: threshold,
        match_count: limit,
      });
      
      if (!error && data && data.length > 0) {
        // Fetch profile data for all unique user IDs
        const userIds = [...new Set(data.map((item: any) => item.user_id).filter(Boolean))];
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
        
        // Convert to FurnitureImage format with profile data
        return data.map((item: any) => {
          const profile = profilesMap.get(item.user_id);
          return {
            id: item.id,
            user_id: item.user_id,
            public_url: item.public_url,
            item: item.item,
            style: item.style,
            created_at: new Date().toISOString(), // RPC doesn't return this, but it's not critical
            username: profile?.username,
            display_name: profile?.display_name,
            avatar_url: profile?.avatar_url,
          };
        });
      }
    } catch (embeddingError) {
      console.warn('Vector similarity search failed:', embeddingError);
      // Text-based fallback commented out for testing
      throw embeddingError; // Re-throw to see the actual error
    }

    // Only select columns needed for display to reduce egress
    let query = supabase
      .from('furniture_images')
      .select('id, user_id, public_url, item, style, created_at')
      .limit(limit);

    // Build query based on available analysis fields
    if (analysis.item) {
      query = query.ilike('item', `%${analysis.item}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Text-based similarity search error:', error);
      throw error;
    }

    // Fetch profile data for all unique user IDs
    const validItems = data || [];
    const userIds = [...new Set(validItems.map((item: any) => item.user_id).filter(Boolean))];
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
    
    // Map profile data to items
    return validItems.map((item: any) => {
      const profile = item.user_id ? profilesMap.get(item.user_id) : null;
      return {
        ...item,
        username: profile?.username,
        display_name: profile?.display_name,
        avatar_url: profile?.avatar_url,
      };
    });
    
    // Return empty array if vector search didn't return results
  } catch (error: any) {
    console.error('Similarity search error:', error);
    // Return empty array on error rather than throwing
    return [];
  }
}

