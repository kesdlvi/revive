import { supabase } from '@/lib/supabase';
import { TutorialPlan } from './openai';

export interface SavedTutorial {
  id: string;
  user_id: string;
  tutorial_plan: TutorialPlan;
  scanned_image_uri: string;
  created_at: string;
}

/**
 * Save a tutorial for the current user
 */
export async function saveTutorial(
  userId: string,
  tutorialPlan: TutorialPlan,
  scannedImageUri: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('saved_tutorials')
      .insert({
        user_id: userId,
        tutorial_plan: tutorialPlan,
        scanned_image_uri: scannedImageUri,
      });

    if (error) {
      // If it's a duplicate key error, that's okay - tutorial is already saved
      if (error.code === '23505') {
        return { success: true };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to save tutorial' };
  }
}

/**
 * Get all saved tutorials for the current user
 */
export async function getSavedTutorials(userId: string): Promise<SavedTutorial[]> {
  try {
    const { data, error } = await supabase
      .from('saved_tutorials')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching saved tutorials:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching saved tutorials:', error);
    return [];
  }
}

/**
 * Delete a saved tutorial
 */
export async function deleteSavedTutorial(
  tutorialId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('saved_tutorials')
      .delete()
      .eq('id', tutorialId)
      .eq('user_id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete tutorial' };
  }
}


