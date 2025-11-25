import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { analyzeFurniture, generateEmbedding } from './openai';

/**
 * Get the current authenticated user's ID
 */
async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Test Supabase connection
 */
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('profiles').select('count').limit(1);
    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
    console.log('✅ Supabase connected successfully!');
    return true;
  } catch (error) {
    console.error('Supabase connection failed:', error);
    return false;
  }
}

/**
 * Test image upload to Supabase Storage
 * @param imageUri - Local file URI (e.g., from camera or file picker)
 * @param userId - Optional user ID (will use authenticated user if not provided)
 */
export async function testImageUpload(
  imageUri: string,
  userId?: string
): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
  try {
    // Get current user ID if not provided
    const currentUserId = userId || await getCurrentUserId();
    if (!currentUserId) {
      return {
        success: false,
        error: 'No user ID provided and no authenticated user found. Please sign in first.',
      };
    }

    console.log('📤 Starting image upload test...');
    console.log('Image URI:', imageUri);
    console.log('User ID:', currentUserId);

    // 1. Read file as base64 (React Native compatible)
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64' as any,
    });

    // 2. Convert base64 to Uint8Array (Supabase accepts this)
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    // 3. Create file path
    const fileExt = imageUri.split('.').pop() || 'jpg';
    const fileName = `test-${Date.now()}.${fileExt}`;
    const filePath = `${currentUserId}/${fileName}`;

    console.log('📁 Uploading to path:', filePath);

    // 4. Upload to Supabase Storage (using Uint8Array)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('furniture-images')
      .upload(filePath, byteArray, {
        contentType: `image/${fileExt}`,
        upsert: false, // Don't overwrite if exists
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      return {
        success: false,
        error: uploadError.message || 'Upload failed',
      };
    }

    console.log('✅ Upload successful!', uploadData);

    // 4. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('furniture-images')
      .getPublicUrl(filePath);

    console.log('🔗 Public URL:', publicUrl);

    return {
      success: true,
      publicUrl,
    };
  } catch (error: any) {
    console.error('❌ Test upload failed:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Test saving metadata to database with embedding
 */
export async function testSaveMetadata(
  publicUrl: string,
  storagePath: string,
  userId?: string,
  analysis?: { item?: string; style?: string; material?: string; color?: string; condition?: string; description?: string }
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Get current user ID if not provided
    const currentUserId = userId || await getCurrentUserId();
    if (!currentUserId) {
      return {
        success: false,
        error: 'No user ID provided and no authenticated user found. Please sign in first.',
      };
    }

    console.log('💾 Saving metadata to database...');
    console.log('Using user ID:', currentUserId);

    // Generate embedding if analysis is provided
    let embedding: number[] | undefined;
    if (analysis) {
      try {
        console.log('🔢 Generating embedding...');
        embedding = await generateEmbedding(analysis);
        console.log('✅ Embedding generated:', embedding.length, 'dimensions');
      } catch (error: any) {
        console.warn('⚠️ Failed to generate embedding:', error.message);
        // Continue without embedding (optional)
      }
    }

    const metadata: any = {
      user_id: currentUserId,
      storage_path: storagePath,
      public_url: publicUrl,
      item: analysis?.item || 'Test Chair',
      style: analysis?.style || 'Modern',
      material: analysis?.material || 'Wood',
      color: analysis?.color || 'Brown',
      condition: analysis?.condition || 'Good',
      description: analysis?.description || 'Test upload from app',
    };

    // Add embedding if generated
    if (embedding) {
      metadata.embedding = embedding;
    }

    const { data, error } = await supabase
      .from('furniture_images')
      .insert(metadata)
      .select()
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      return {
        success: false,
        error: error.message || 'Database insert failed',
      };
    }

    console.log('✅ Metadata saved!', data);
    if (embedding) {
      console.log('✅ Embedding stored in database');
    }
    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.error('❌ Save metadata failed:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Test fetching images from database
 */
export async function testFetchImages(): Promise<{ success: boolean; images?: any[]; error?: string }> {
  try {
    console.log('📥 Fetching images from database...');

    const { data, error } = await supabase
      .from('furniture_images')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Fetch error:', error);
      return {
        success: false,
        error: error.message || 'Fetch failed',
      };
    }

    console.log('✅ Fetched images:', data?.length || 0);
    return {
      success: true,
      images: data || [],
    };
  } catch (error: any) {
    console.error('❌ Fetch images failed:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Complete test: Upload image, analyze, generate embedding, and save metadata
 */
export async function testCompleteUpload(
  imageUri: string,
  userId?: string
): Promise<{ success: boolean; imageData?: any; error?: string }> {
  try {
    // Get current user ID if not provided
    const currentUserId = userId || await getCurrentUserId();
    if (!currentUserId) {
      return { success: false, error: 'No user ID provided and no authenticated user found. Please sign in first.' };
    }

    // 1. Test connection
    const connected = await testSupabaseConnection();
    if (!connected) {
      return { success: false, error: 'Failed to connect to Supabase' };
    }

    // 2. Upload image
    const uploadResult = await testImageUpload(imageUri, currentUserId);
    if (!uploadResult.success || !uploadResult.publicUrl) {
      return { success: false, error: uploadResult.error || 'Upload failed' };
    }

    // Extract storage path from public URL
    const urlParts = uploadResult.publicUrl.split('/');
    const storagePath = urlParts.slice(urlParts.indexOf('furniture-images')).join('/');

    // 3. Analyze image with OpenAI (get real analysis)
    console.log('🔍 Analyzing image with OpenAI...');
    let analysis: any;
    try {
      const analysisResult = await analyzeFurniture(imageUri, 'simple');
      analysis = {
        item: analysisResult.item,
        style: undefined, // Simple mode doesn't return style
        material: undefined,
        color: undefined,
        condition: undefined,
        description: `Furniture item: ${analysisResult.item}`,
      };
      console.log('✅ Analysis complete:', analysis.item);
    } catch (error: any) {
      console.warn('⚠️ Analysis failed, using test data:', error.message);
      // Fallback to test data if analysis fails
      analysis = {
        item: 'Test Chair',
        style: 'Modern',
        material: 'Wood',
        color: 'Brown',
        condition: 'Good',
        description: 'Test upload from app',
      };
    }

    // 4. Save metadata with embedding (generated from real or test analysis)
    const metadataResult = await testSaveMetadata(
      uploadResult.publicUrl,
      storagePath,
      currentUserId,
      analysis // Pass analysis to generate embedding
    );

    if (!metadataResult.success) {
      return { success: false, error: metadataResult.error || 'Metadata save failed' };
    }

    return {
      success: true,
      imageData: metadataResult.data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Complete test failed',
    };
  }
}

