import { supabase } from '@/lib/supabase';
import { RepairIssue } from '@/types/furniture';

/**
 * Update the description of a post
 */
export async function updatePostDescription(
  postId: string,
  description: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // First verify the post belongs to the user
    const { data: post, error: fetchError } = await supabase
      .from('furniture_images')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (fetchError || !post) {
      return { success: false, error: 'Post not found' };
    }

    if (post.user_id !== userId) {
      return { success: false, error: 'You can only edit your own posts' };
    }

    // Update the description
    const { error: updateError } = await supabase
      .from('furniture_images')
      .update({ description: description.trim() || null })
      .eq('id', postId)
      .eq('user_id', userId); // Extra safety check

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update description' };
  }
}

/**
 * Update the issues of a post
 */
export async function updatePostIssues(
  postId: string,
  issues: RepairIssue[],
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // First verify the post belongs to the user
    const { data: post, error: fetchError } = await supabase
      .from('furniture_images')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (fetchError || !post) {
      return { success: false, error: 'Post not found' };
    }

    if (post.user_id !== userId) {
      return { success: false, error: 'You can only edit your own posts' };
    }

    // Update the issues (store as JSON)
    // Note: This will fail if the column doesn't exist - user needs to run the SQL migration
    const { error: updateError } = await supabase
      .from('furniture_images')
      .update({ issues: issues.length > 0 ? JSON.stringify(issues) : null })
      .eq('id', postId)
      .eq('user_id', userId); // Extra safety check

    if (updateError) {
      // If column doesn't exist, provide helpful error message
      if (updateError.code === '42703') {
        return { 
          success: false, 
          error: 'Issues column not found. Please run the SQL migration to add the issues column to the furniture_images table.' 
        };
      }
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update issues' };
  }
}

