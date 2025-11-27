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
        // Convert to FurnitureImage format
        return data.map((item: any) => ({
          id: item.id,
          user_id: item.user_id,
          public_url: item.public_url,
          item: item.item,
          style: item.style,
          created_at: new Date().toISOString(), // RPC doesn't return this, but it's not critical
        }));
      }
    } catch (embeddingError) {
      console.warn('Vector similarity search failed:', embeddingError);
      // Text-based fallback commented out for testing
      throw embeddingError; // Re-throw to see the actual error
    }

    let query = supabase
      .from('furniture_images')
      .select('id, user_id, public_url, item, style, description, material, color, created_at')
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

    return data || [];
    
    // Return empty array if vector search didn't return results
  } catch (error: any) {
    console.error('Similarity search error:', error);
    // Return empty array on error rather than throwing
    return [];
  }
}

