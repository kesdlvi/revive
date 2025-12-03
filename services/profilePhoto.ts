import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '@/lib/supabase';

/**
 * Upload profile photo to Supabase Storage
 */
export async function uploadProfilePhoto(
  imageUri: string,
  userId: string
): Promise<{ success: boolean; avatarUrl?: string; error?: string }> {
  try {
    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64' as any,
    });

    // Convert base64 to Uint8Array
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    // Create file path - use avatars bucket or profile-avatars
    const fileExt = imageUri.split('.').pop() || 'jpg';
    const fileName = `avatar-${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Try to upload to avatars bucket first, fallback to furniture-images
    let bucket = 'avatars';
    let { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, byteArray, {
        contentType: `image/${fileExt}`,
        upsert: true, // Overwrite if exists
      });

    // If avatars bucket doesn't exist, try furniture-images
    if (uploadError && uploadError.message?.includes('not found')) {
      bucket = 'furniture-images';
      const altPath = `avatars/${filePath}`;
      const result = await supabase.storage
        .from(bucket)
        .upload(altPath, byteArray, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });
      uploadData = result.data;
      uploadError = result.error;
    }

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return {
        success: false,
        error: uploadError.message || 'Upload failed',
      };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(uploadData?.path || filePath);

    // Update profile with avatar_url
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return {
        success: false,
        error: updateError.message || 'Failed to update profile',
      };
    }

    return {
      success: true,
      avatarUrl: publicUrl,
    };
  } catch (error: any) {
    console.error('Error uploading profile photo:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

