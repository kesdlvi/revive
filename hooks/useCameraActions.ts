import { useState, useRef } from 'react';
import { CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { analyzeFurniture } from '@/services/openai';
import { testCompleteUpload } from '@/services/supabaseTest';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

type CameraMode = 'scan' | 'post';

interface UseCameraActionsProps {
  onImageAnalyzed: (uri: string, analysis: any) => void;
  onFeedRefresh?: () => void;
  onNavigateToFeed?: () => void;
}

export function useCameraActions({ onImageAnalyzed, onFeedRefresh, onNavigateToFeed }: UseCameraActionsProps) {
  const { user } = useAuth();
  const cameraRef = useRef<CameraView>(null);
  const [cameraMode, setCameraMode] = useState<CameraMode>('scan');
  const [postPreviewUri, setPostPreviewUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [showPhotoSheet, setShowPhotoSheet] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [furnitureAnalysis, setFurnitureAnalysis] = useState<any>(null);
  const [currentPhotoUri, setCurrentPhotoUri] = useState<string | null>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);

  const handleImageSelected = async (uri: string) => {
    if (cameraMode === 'post') {
      // Post mode: show preview with upload button
      setPostPreviewUri(uri);
    } else {
      // Scan mode: show analysis and bottom sheet
      setPreviewUri(uri);
      setCurrentPhotoUri(uri);
      setShowPhotoSheet(true);
      
      // Analyze the furniture (start with simple mode only)
      setIsAnalyzing(true);
      try {
        // Start with simple identification only (saves cost)
        const simpleResult = await analyzeFurniture(uri, 'simple');
        setFurnitureAnalysis(simpleResult);
        onImageAnalyzed(uri, simpleResult);
      } catch (error: any) {
        console.error('Analysis error:', error);
        const errorMessage = error?.message || 'Failed to analyze furniture';
        Alert.alert(
          'Analysis Error',
          errorMessage + '\n\nShowing photo anyway.',
          [{ text: 'OK' }]
        );
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        // @ts-ignore - takePictureAsync exists on CameraView
        const photo = await cameraRef.current.takePictureAsync();
        await handleImageSelected(photo.uri);
      } catch {
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const pickImageFromLibrary = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your photo library');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        await handleImageSelected(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image from library');
    }
  };

  const handlePostUpload = async () => {
    if (!postPreviewUri || !user?.id) {
      Alert.alert('Error', 'No photo to upload or user not signed in');
      return;
    }

    setIsUploading(true);
    try {
      const result = await testCompleteUpload(postPreviewUri, user.id);
      
      if (result.success) {
        Alert.alert(
          'Success',
          'Photo uploaded successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset post preview
                setPostPreviewUri(null);
                // Refresh feed to show new photo
                if (onFeedRefresh) {
                  onFeedRefresh();
                }
                // Go back to feed
                if (onNavigateToFeed) {
                  onNavigateToFeed();
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('Upload Failed', result.error || 'Failed to upload photo');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Upload Error', error?.message || 'Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRequestDetailedAnalysis = async () => {
    if (!currentPhotoUri) return;
    
    setIsAnalyzing(true);
    try {
      const detailedResult = await analyzeFurniture(currentPhotoUri, 'detailed');
      setFurnitureAnalysis(detailedResult);
    } catch (error: any) {
      console.error('Detailed analysis error:', error);
      const errorMessage = error?.message || 'Failed to get detailed analysis';
      Alert.alert('Analysis Error', errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearPreview = () => {
    setPreviewUri(null);
    setPostPreviewUri(null);
    setShowPhotoSheet(false);
    setFurnitureAnalysis(null);
    setCurrentPhotoUri(null);
  };

  return {
    cameraRef,
    cameraMode,
    setCameraMode,
    postPreviewUri,
    setPostPreviewUri,
    isUploading,
    previewUri,
    setPreviewUri,
    showPhotoSheet,
    setShowPhotoSheet,
    isAnalyzing,
    furnitureAnalysis,
    currentPhotoUri,
    flashEnabled,
    setFlashEnabled,
    takePicture,
    pickImageFromLibrary,
    handlePostUpload,
    handleRequestDetailedAnalysis,
    clearPreview,
  };
}

